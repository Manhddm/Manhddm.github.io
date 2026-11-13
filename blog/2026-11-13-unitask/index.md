---
slug: unitask-coroutine
title: "Tạm biệt Coroutine: Làm quen với UniTask trong Unity"
authors: [ Manhddm ]
tags: [ unity, csharp, architecture, unitask ]
---

Trong quá trình làm game với Unity, rất nhiều việc không diễn ra ngay trong một frame: chờ hiệu ứng nổ xong, chờ tải màn
chơi, chờ dữ liệu từ server, hay chờ người chơi bấm nút xác nhận.

Quen thuộc nhất là dùng **Coroutine**. Nhưng khi bài toán không chỉ là "đợi vài giây rồi làm tiếp", mà cần **lấy kết quả
trả về**, **bắt lỗi**, hay **chờ nhiều việc chạy song song**, Coroutine bắt đầu bộc lộ sự cồng kềnh.

C# vốn có sẵn `async/await` và `Task` cho việc này, nhưng mang nguyên `Task` của .NET vào môi trường chạy theo từng
frame của Unity lại có những chi phí ngầm không đáng có. Đó là lý do **UniTask** ra đời.

{/* truncate */}

## 1. Coroutine "vướng" ở đâu khi logic phức tạp lên?

Hãy hình dung một việc rất đời thường khi người chơi vừa bấm vào màn chơi: game cần chuẩn bị **cùng lúc** hai thứ:

1. Tải dữ liệu màn chơi (`LevelData`, giả sử mất 2 giây)
2. Tải hồ sơ người chơi (`PlayerProfile`, giả sử mất 1 giây)
3. Khi **cả hai** đã sẵn sàng, gom chúng lại để khởi tạo gameplay

Nếu dùng **Coroutine**, khó khăn đầu tiên bạn gặp phải là: một hàm `IEnumerator` **không thể `return` kết quả** về cho
nơi gọi nó. Nó giống như bạn nhờ một người đi lấy đồ, nhưng người đó không thể đưa tận tay bạn mà bắt bạn phải đặt sẵn
một cái hòm thư (callback + biến cờ) rồi đứng canh xem hòm thư đã có đồ chưa:

```csharp
using System;
using System.Collections;
using UnityEngine;

public class GameInitializer : MonoBehaviour
{
    private bool _levelLoaded;
    private bool _profileLoaded;

    private LevelData _levelData;
    private PlayerProfile _profile;

    private void Start()
    {
        StartCoroutine(InitializeGame());
    }

    private IEnumerator InitializeGame()
    {
        // Khởi chạy hai tác vụ cùng lúc và truyền callback nhận kết quả
        StartCoroutine(LoadLevel(OnLevelLoaded));
        StartCoroutine(LoadProfile(OnProfileLoaded));

        // Đứng canh mỗi frame cho tới khi cả hai biến cờ đều bật
        yield return new WaitUntil(() => _levelLoaded && _profileLoaded);

        InitializeGameplay(_levelData, _profile);
    }

    private IEnumerator LoadLevel(Action<LevelData> onCompleted)
    {
        yield return new WaitForSeconds(2f);
        onCompleted?.Invoke(new LevelData());
    }

    private IEnumerator LoadProfile(Action<PlayerProfile> onCompleted)
    {
        yield return new WaitForSeconds(1f);
        onCompleted?.Invoke(new PlayerProfile());
    }

    private void OnLevelLoaded(LevelData data)
    {
        _levelData = data;
        _levelLoaded = true;
    }

    private void OnProfileLoaded(PlayerProfile profile)
    {
        _profile = profile;
        _profileLoaded = true;
    }

    private void InitializeGameplay(LevelData level, PlayerProfile profile)
    {
        Debug.Log("Gameplay initialized!");
    }
}
```

Giờ hãy xem cùng bài toán đó khi viết bằng **UniTask**:

```csharp
using System;
using System.Threading;
using Cysharp.Threading.Tasks;
using UnityEngine;

public class GameInitializer : MonoBehaviour
{
    private void Start()
    {
        InitializeGameAsync(this.GetCancellationTokenOnDestroy()).Forget();
    }

    private async UniTask InitializeGameAsync(CancellationToken token)
    {
        try
        {
            // Chạy song song và nhận trực tiếp cả hai kết quả khi hoàn tất
            var (level, profile) = await UniTask.WhenAll(
                LoadLevelAsync(token),
                LoadProfileAsync(token)
            );

            InitializeGameplay(level, profile);
        }
        catch (OperationCanceledException)
        {
            Debug.Log("Game initialization cancelled!");
        }
    }

    private async UniTask<LevelData> LoadLevelAsync(CancellationToken token)
    {
        await UniTask.Delay(TimeSpan.FromSeconds(2), cancellationToken: token);
        return new LevelData();
    }

    private async UniTask<PlayerProfile> LoadProfileAsync(CancellationToken token)
    {
        await UniTask.Delay(TimeSpan.FromSeconds(1), cancellationToken: token);
        return new PlayerProfile();
    }

    private void InitializeGameplay(LevelData level, PlayerProfile profile)
    {
        Debug.Log("Gameplay initialized!");
    }
}
```

Toàn bộ biến cờ `_levelLoaded`, `_profileLoaded` và các hàm callback biến mất. Đặt hai đoạn code cạnh nhau, ta thấy rõ 3
giới hạn thực sự của Coroutine:

- **Không trả về dữ liệu trực tiếp:** Vì `IEnumerator` đã bị trưng dụng cho cơ chế `yield` từng bước của Unity, bạn
  không thể viết `LevelData data = yield return LoadLevel();` mà buộc phải vòng qua callback hoặc biến toàn cục trong
  class.
- **Không dùng được `try/catch` bao quanh `yield`:** C# cấm đặt `yield return` bên trong khối `try-catch`. Nếu bước tải
  màn chơi bị lỗi giữa chừng, bạn không thể bắt lỗi tập trung ở hàm cha một cách tự nhiên như code đồng bộ.
- **Phát sinh rác bộ nhớ (GC allocation):** Mỗi lần gọi `StartCoroutine` hay `new WaitForSeconds(...)` (nếu không tạo
  sẵn để dùng lại) đều cấp phát object mới trên heap. Làm việc này lặp đi lặp lại trong gameplay sẽ tích tụ rác cho
  Garbage Collector.

## 2. Vì sao không dùng luôn `Task` của .NET?

Thắc mắc rất tự nhiên: *"C# đã có sẵn `System.Threading.Tasks.Task`, sao không dùng luôn mà phải cài thêm thư viện?"*

Để hiểu lý do, hãy nhìn vào cách Unity vận hành. Hầu hết API của Unity (`Transform`, `GameObject`, `Instantiate`...) chỉ
được phép gọi trên **main thread** và chạy theo từng nhịp của một vòng lặp lớn gọi là **`PlayerLoop`** (từ
`Initialization` → `FixedUpdate` → `Update` → `LateUpdate`...).

Khi bạn dùng `Task` chuẩn của .NET trong Unity:

- **Tốn bộ nhớ cấp phát trên heap:** `Task` là một `class` (reference type). Mỗi khi một hàm `async Task` phải tạm dừng
  để chờ, một đối tượng `Task` mới thường được cấp phát trên heap. Trong ứng dụng web hay desktop thì không đáng kể,
  nhưng trong game chạy 60–120 FPS, tạo rác trên heap liên tục là điều tối kỵ. Ngược lại, `UniTask` là một
  `readonly struct` (value type) kết hợp với cơ chế tái sử dụng (object pool) bên dưới, giúp luồng chạy thông thường đạt
  **zero-allocation**.
- **Chi phí đồng bộ ngữ cảnh và sự lệch pha với `PlayerLoop`:** Nhiều người lầm tưởng cứ `await Task` là code sẽ bị nhảy
  sang background thread. Thực tế, Unity gắn sẵn một `UnitySynchronizationContext` trên main thread: khi bạn `await` một
  `Task` từ main thread, sau khi chờ xong, `SynchronizationContext` sẽ tự động đưa phần code tiếp theo quay về lại main
  thread. Code chỉ thực sự nhảy sang luồng khác khi bạn chủ động dùng `Task.Run`, gắn `ConfigureAwait(false)` hoặc gọi
  từ ngoài context. Tuy nhiên, việc bắt giữ và chuyển tiếp qua `SynchronizationContext` như vậy vẫn tốn chi phí phụ (
  overhead), và các API hẹn giờ/luồng của `Task` (như `Task.Delay`) vốn dựa vào bộ đếm thời gian hệ thống cùng
  `ThreadPool` của .NET — thứ bị hạn chế trên nền tảng đơn luồng như **WebGL** và cũng không hiểu khái niệm
  `Time.timeScale` hay từng pha `Update`/`FixedUpdate` của Unity. UniTask bỏ qua trung gian này và móc trực tiếp vào
  `PlayerLoop` của Unity.
- **Chờ trực tiếp các đối tượng của Unity:** Với UniTask, bạn có thể `await` thẳng `AsyncOperation` (như chuyển scene),
  `ResourceRequest`, `UnityWebRequestAsyncOperation`, một `IEnumerator` (Coroutine cũ), hoặc các
  `CustomYieldInstruction` (như `WaitUntil`, `WaitWhile`). Còn với các `YieldInstruction` thuần của engine như
  `WaitForFixedUpdate` hay `WaitForSeconds`, UniTask cung cấp sẵn hàm tương ứng nhẹ hơn là
  `UniTask.WaitForFixedUpdate()` và `UniTask.Delay()`.

## 3. Cài đặt và 3 kiểu trả về cơ bản

Bạn có thể cài UniTask qua **Unity Package Manager** (*Add package from git URL...*):

```text
https://github.com/Cysharp/UniTask.git?path=src/UniTask/Assets/Plugins/UniTask
```

*(Hoặc cài qua OpenUPM với tên gói `com.cysharp.unitask`.)*

Khi viết hàm bất đồng bộ với UniTask, bạn chỉ cần chọn 1 trong 3 kiểu trả về sau:

- **`UniTask`:** Dùng khi hàm cần chờ đợi nhưng **không** trả về dữ liệu (tương tự `void`, nhưng nơi gọi có thể `await`
  để đợi nó xong).
- **`UniTask<T>`:** Dùng khi hàm trả về kết quả kiểu `T` sau khi chờ xong (như `UniTask<LevelData>` ở Mục 1).
- **`UniTaskVoid`:** Dùng cho hàm kiểu **"bấm nút rồi để đó tự chạy"** (*fire-and-forget*) — tức là không ai cần `await`
  nó cả, thường gọi từ `Start()` hoặc sự kiện nút bấm UI.

> **Tại sao nên tránh `async void` và dùng `.Forget()`?**
> Trong Unity, nếu có lỗi văng ra trong một hàm `async void`, lỗi đó không bị "nuốt mất" mà vẫn được đẩy về
`UnitySynchronizationContext` và in ra Console. Tuy nhiên, `async void` vẫn phải đi qua `SynchronizationContext` (tốn
> cấp phát bộ nhớ), người gọi không có cách nào theo dõi tiến độ của nó, và nó nằm ngoài hệ thống quản lý của UniTask. Vì
> vậy, hãy dùng `async UniTaskVoid` (hoặc `async UniTask`) kèm theo `.Forget()` ở nơi gọi.
>
> Lưu ý nhỏ: nếu bạn gọi một hàm trả về `UniTask` mà không `await` **bên trong một hàm `async` khác**, trình biên dịch
> C# sẽ cảnh báo `CS4014` (vì sợ bạn quên `await`), và `.Forget()` sẽ giúp tắt cảnh báo này. Còn khi gọi từ một hàm đồng
> bộ bình thường như `Start()` ở Mục 1 thì vốn không có cảnh báo `CS4014`, nhưng viết `.Forget()` vẫn là thói quen rất tốt
> để nói rõ với người đọc code: *"Tôi cố tình cho tác vụ này chạy ngầm và không cần chờ nó tại đây."*

## 4. Bảng chuyển đổi nhanh: từ Coroutine sang UniTask

Nếu bạn đã quen tay với Coroutine, bảng dưới đây là cách dịch tương đương sang UniTask:

| Coroutine                                           | UniTask                                                                                       | Ghi chú                                                                                                         |
|-----------------------------------------------------|-----------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| `yield return null;`                                | `await UniTask.NextFrame(token);`                                                             | Đảm bảo luôn sang frame kế tiếp                                                                                 |
| `yield return null;` *(linh hoạt pha)*              | `await UniTask.Yield(token);`                                                                 | Quay lại ở pha `Update` kế tiếp (nếu gọi trước `Update` trong cùng frame thì chạy ngay ở `Update` của frame đó) |
| `yield return new WaitForSeconds(2f);`              | `await UniTask.Delay(TimeSpan.FromSeconds(2), cancellationToken: token);`                     | Tính theo thời gian trong game (bị ảnh hưởng bởi `Time.timeScale`)                                              |
| `yield return new WaitForSecondsRealtime(2f);`      | `await UniTask.Delay(TimeSpan.FromSeconds(2), DelayType.Realtime, cancellationToken: token);` | Tính theo đồng hồ thực, bỏ qua `Time.timeScale`                                                                 |
| `yield return new WaitForFixedUpdate();`            | `await UniTask.WaitForFixedUpdate(token);`                                                    | Chờ tới nhịp `FixedUpdate` tiếp theo                                                                            |
| `yield return new WaitUntil(() => isReady);`        | `await UniTask.WaitUntil(() => isReady, cancellationToken: token);`                           | Kiểm tra điều kiện mỗi frame giống hệt `WaitUntil`                                                              |
| `yield return SceneManager.LoadSceneAsync("Game");` | `await SceneManager.LoadSceneAsync("Game").ToUniTask(cancellationToken: token);`              | Có thể truyền thêm `progress` để cập nhật thanh loading                                                         |

Ngoài `UniTask.WhenAll` (đợi tất cả cùng xong), bạn sẽ rất hay dùng **`UniTask.WhenAny`** (chỉ cần **một** nhánh xong
trước là đi tiếp). Ví dụ kinh điển: phát đoạn cutscene mở đầu, nhưng cho phép người chơi bấm nút Skip bất cứ lúc nào:

```csharp
private async UniTask PlayCutsceneWithSkipAsync(CancellationToken outerToken)
{
    using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(outerToken);

    int winner = await UniTask.WhenAny(
        PlayCutsceneAsync(linkedCts.Token),
        skipButton.OnClickAsync(linkedCts.Token)
    );

    // Nhánh nào về đích trước thì hủy ngay nhánh còn lại
    linkedCts.Cancel();

    if (winner == 1)
    {
        StopCutsceneImmediately();
    }
}
```

> **Cạm bẫy dễ sót:** `UniTask.WhenAny` giống như cuộc đua 2 người — ngay khi người thứ nhất chạm đích là trọng tài công
> bố kết quả, nhưng **người thứ hai vẫn tiếp tục chạy** nếu không ai bảo dừng. Nhờ tạo `linkedCts` và gọi
`linkedCts.Cancel()` ngay sau `WhenAny`, nếu người chơi bấm Skip ở giây thứ 1 thì tác vụ `PlayCutsceneAsync` sẽ dừng
> ngay lập tức thay vì chạy ngầm hết đoạn cutscene.

## 5. Sợi dây an toàn: Quản lý vòng đời với `CancellationToken`

Đây là chỗ người mới chuyển từ Coroutine sang UniTask dễ vấp nhất.

Hãy nhớ lại cơ chế của **Coroutine**: nó gắn vào `MonoBehaviour`. Khi `GameObject` chứa nó bị hủy (`Destroy`) hoặc bị
tắt (`gameObject.SetActive(false)`), Unity sẽ tự động cắt toàn bộ Coroutine trên đó *(lưu ý: nếu bạn chỉ bỏ tích
component bằng `enabled = false` mà `GameObject` vẫn đang bật thì Coroutine vẫn chạy bình thường)*.

Còn **UniTask** thì khác: nó chỉ là một tác vụ đăng ký vào `PlayerLoop`. Nó hoàn toàn không biết `GameObject` của bạn
còn sống hay đã bị `Destroy`. Nếu nhân vật đang chờ 2 giây để tung đòn mà bị quái đánh chết ở giây thứ 1 (
`Destroy(gameObject)`), đến giây thứ 2 hàm `async` vẫn tỉnh dậy, cố truy cập vào `transform.position` của cái xác đã
biến mất và ném thẳng lỗi `MissingReferenceException`.

Để khắc phục, ta dùng **`CancellationToken`** — hãy hình dung nó như một "sợi dây báo hủy" nối giữa `GameObject` và tác
vụ đang chạy.

### Cách 1: Tự hủy khi `GameObject` bị `Destroy`

Với tác vụ có vòng đời đi theo `MonoBehaviour`, chỉ cần lấy token từ `this.GetCancellationTokenOnDestroy()` và truyền
vào mọi lệnh `await`:

```csharp
var token = this.GetCancellationTokenOnDestroy();
await UniTask.Delay(TimeSpan.FromSeconds(2), cancellationToken: token);
```

*(Từ Unity 2022.2 trở lên, bản thân `MonoBehaviour` cũng có sẵn thuộc tính `destroyCancellationToken` làm đúng việc
này.)*

### Cách 2: Hủy chủ động bất cứ lúc nào bằng `CancellationTokenSource`

Nhiều khi `GameObject` chưa hề bị `Destroy`, nhưng bạn vẫn muốn **hủy tác vụ cũ để chạy tác vụ mới**. Ví dụ: khi nhân
vật trúng đòn, sprite đổi sang màu đỏ trong `0.15` giây rồi trả về màu gốc. Nếu chưa hết `0.15` giây mà trúng thêm đòn
nữa, ta phải hủy bộ đếm cũ đi để tính lại từ đầu:

```csharp
using System;
using System.Threading;
using Cysharp.Threading.Tasks;
using UnityEngine;

public class HitFlash : MonoBehaviour
{
    [SerializeField] private SpriteRenderer spriteRenderer;
    [SerializeField] private Color hitColor = Color.red;
    [SerializeField] private float duration = 0.15f;

    private Color _originalColor;
    private CancellationTokenSource _flashCts;

    private void Awake()
    {
        _originalColor = spriteRenderer.color;
    }

    public void PlayFlash()
    {
        // Cắt bộ đếm nhấp nháy cũ (nếu đang chạy dở)
        CancelFlash();

        // Nối chung với token Destroy để nếu nhân vật bị hủy giữa chừng thì cũng tự dừng
        _flashCts = CancellationTokenSource.CreateLinkedTokenSource(
            this.GetCancellationTokenOnDestroy()
        );

        FlashAsync(_flashCts.Token).Forget();
    }

    private async UniTaskVoid FlashAsync(CancellationToken token)
    {
        spriteRenderer.color = hitColor;

        // SuppressCancellationThrow trả về true nếu bị hủy, giúp tránh phải viết try/catch
        bool isCanceled = await UniTask.Delay(
            TimeSpan.FromSeconds(duration),
            cancellationToken: token
        ).SuppressCancellationThrow();

        if (isCanceled) return;

        spriteRenderer.color = _originalColor;
    }

    private void CancelFlash()
    {
        if (_flashCts == null) return;

        _flashCts.Cancel();
        _flashCts.Dispose();
        _flashCts = null;
    }

    private void OnDestroy()
    {
        CancelFlash();
    }
}
```

Mẹo rất đáng giá ở đây là **`.SuppressCancellationThrow()`**. Mặc định trong C#, khi một `CancellationToken` bị kích
hoạt, lệnh `await` sẽ ném ra `OperationCanceledException`. Việc ném và bắt exception liên tục cho một hành vi bình
thường trong gameplay (như trúng đòn liên tiếp) vừa làm code đầy `try/catch`, vừa tốn chi phí tạo exception. Gắn
`.SuppressCancellationThrow()` vào sau `Delay` biến việc hủy thành một biến `bool isCanceled` nhẹ nhàng.

> **Bẫy với Object Pooling:** `GetCancellationTokenOnDestroy()` chỉ báo hủy khi thực sự gọi `Destroy()`. Nếu quái vật
> chết nhưng bạn chỉ gọi `gameObject.SetActive(false)` để cất vào Pool dùng lại, token này sẽ **không** kích hoạt. Với các
> object dùng Pool, hãy gọi `CancelFlash()` và trả màu gốc ngay trong `OnDisable()`.

## 6. Chọn đúng nhịp trong frame với `PlayerLoopTiming`

Trong một frame của Unity, mọi thứ diễn ra theo thứ tự: xử lý vật lý (`FixedUpdate`) → chạy logic game (`Update`) → chạy
animation và tính toán vị trí sau cùng như camera (`LateUpdate`).

Hầu hết các lệnh chờ của UniTask (`Yield`, `Delay`, `WaitUntil`) mặc định đánh thức code của bạn dậy ở pha `Update`.
Nhưng bạn hoàn toàn có thể chỉ định một pha khác thông qua `PlayerLoopTiming`.

Ví dụ: bạn muốn tạo một vùng gió thổi đẩy lùi nhân vật liên tục trong `1.5` giây. Vì lực đẩy liên tục (
`ForceMode.Force`) cần được cộng dồn đều đặn theo từng bước tính vật lý (`FixedUpdate`) chứ không phải theo từng frame
hình ảnh (`Update`), ta cho vòng lặp chạy theo nhịp `FixedUpdate`:

```csharp
private async UniTask ApplyWindZoneAsync(Rigidbody rb, Vector3 windForce, CancellationToken token)
{
    float elapsed = 0f;

    while (elapsed < 1.5f)
    {
        // Chờ tới đúng nhịp FixedUpdate tiếp theo
        await UniTask.WaitForFixedUpdate(token);

        rb.AddForce(windForce, ForceMode.Force);
        elapsed += Time.fixedDeltaTime;
    }
}
```

*(Tương tự, nếu bạn cần đọc vị trí xương nhân vật sau khi `Animator` và `LateUpdate` đã tính xong xuôi trong frame đó,
bạn có thể gọi `await UniTask.Yield(PlayerLoopTiming.LastPostLateUpdate, token);`.)*

## 7. Những lỗi thường gặp (và khi nào không nên dùng UniTask)

- **Quên truyền `CancellationToken`:** Lỗi số một khi mới dùng. Hãy coi việc truyền `CancellationToken` vào mọi hàm
  `async` trong `MonoBehaviour` là phản xạ bắt buộc.
- **`await` cùng một biến `UniTask` hai lần:** Hãy hình dung `UniTask` như một chiếc cốc giấy dùng xong là được thu hồi
  ngay về kho (object pool) để người khác dùng tiếp. Nếu bạn lưu `UniTask task = LoadDataAsync();` rồi `await task;` ở
  hai nơi, kết quả ở lần thứ hai là **không được đảm bảo** (thường sẽ văng lỗi `InvalidOperationException`, hoặc nguy
  hiểm hơn là đọc nhầm dữ liệu của một tác vụ khác vừa mượn lại vùng nhớ đó). Nếu thực sự cần `await` nhiều lần cùng một
  tác vụ, hãy gọi `task = LoadDataAsync().Preserve();`.
- **Bỏ mặc lỗi trong các hàm `.Forget()`:** Vì không có nơi nào `await` hàm đó, nếu bên trong văng exception mà không có
  `try/catch`, lỗi sẽ trôi về `UniTaskScheduler.UnobservedTaskException`. Với các tác vụ dễ gặp lỗi ngoại cảnh (như tải
  file, gọi mạng), hãy bọc `try/catch` rõ ràng.
- **Lạm dụng UniTask để thay thế `Update()`:** Viết một vòng lặp
  `while (!token.IsCancellationRequested) { ... await UniTask.Yield(token); }` để di chuyển nhân vật hay xoay đồng xu
  mỗi frame suốt cả màn chơi **không** làm game nhanh hơn hàm `Update()` truyền thống; ngược lại còn tốn thêm chi phí
  duy trì state machine và kiểm tra token mỗi frame. Hãy để `Update()` làm những việc lặp lại vô thời hạn mỗi frame, và
  chỉ dùng UniTask cho những luồng công việc có điểm bắt đầu — chờ đợi — kết thúc rõ ràng.

## 8. Đi xa hơn với UniTask

Khi đã nắm vững những phần trên, bạn có thể khám phá thêm một vài mảnh ghép rất tiện của UniTask:

- **Kết hợp với DOTween / Addressables:** Bạn có thể `await` trực tiếp một tween (thay vì nối dây `.OnComplete(...)`)
  hoặc một thao tác tải Addressables.
- **`IUniTaskAsyncEnumerable` và `Channel`:** Xử lý chuỗi sự kiện theo thời gian (như đợi người chơi bấm đúp nút, hoặc
  hàng đợi hiển thị popup lần lượt).
- **UniTask Tracker (`Window -> UniTask Tracker`):** Một bảng theo dõi ngay trong Unity Editor, liệt kê toàn bộ các
  UniTask đang chạy ngầm và dòng code nào đã khởi tạo chúng — công cụ cứu cánh khi bạn nghi ngờ có tác vụ nào đó quên
  truyền `CancellationToken` và đang bị rò rỉ (leak).

## Tóm tắt

- **Coroutine** vướng víu khi cần trả về giá trị, bắt lỗi `try/catch` hoặc ghép nhiều tác vụ chạy song song; **UniTask**
  giải quyết trọn vẹn bằng cú pháp `async/await`.
- Khác với `Task` của .NET (cấp phát trên heap và phải đi qua `SynchronizationContext`), **UniTask** là
  `readonly struct` chạy thẳng trên `PlayerLoop` của Unity nên đạt zero-allocation ở luồng thông thường và khớp hoàn
  toàn với vòng đời frame của engine.
- Dùng `UniTask` / `UniTask<T>` khi cần `await`, và `async UniTaskVoid` (hoặc gắn `.Forget()`) cho các tác vụ kích hoạt
  xong không cần chờ.
- **Luôn gắn `CancellationToken`** (`GetCancellationTokenOnDestroy()` hoặc `CancellationTokenSource`) để tác vụ không
  chạy lơ lửng khi `GameObject` đã bị hủy, và dùng `.SuppressCancellationThrow()` để kiểm tra hủy gọn nhẹ.
- Không `await` một biến `UniTask` quá một lần nếu chưa `.Preserve()`, và đừng biến UniTask thành hàm `Update()` trá
  hình.

## Tham khảo

- Cysharp/UniTask GitHub repository & README: https://github.com/Cysharp/UniTask
- Unity Manual: *Coroutines*, *Order of execution for event functions* và *PlayerLoop*
