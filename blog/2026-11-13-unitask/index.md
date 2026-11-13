---
slug: unitask-coroutine
title: "Tạm biệt Coroutine: Làm quen với UniTask trong Unity"
authors: [ Manhddm ]
tags: [ unity, csharp, architecture, unitask ]
---

Trong quá trình phát triển game bằng Unity, chúng ta thường xuyên phải xử lý các tác vụ cần chờ đợi: chờ animation hoàn
thành, chờ tải tài nguyên, chuyển scene, chờ thời gian hoặc chờ người chơi thực hiện một hành động. Tôi sẽ nói ngắn gọn
về cách Unity xử lý bất đồng bộ, những điểm yếu cố hữu của Coroutine, và cách UniTask giúp code trở nên sạch sẽ, dễ đọc, dễ bảo trì hơn.

{/* truncate */}

## 1. Tại sao lại cần UniTask?

Hãy xem xét một tình huống quen thuộc khi vào màn chơi: chúng ta cần chạy **đồng thời** hai tác vụ khởi tạo:

1. Tải dữ liệu màn chơi (`LevelData`, giả sử mất 2 giây)
2. Tải hồ sơ người chơi (`PlayerProfile`, giả sử mất 1 giây)
3. Chờ **cả hai** hoàn thành rồi mới khởi tạo gameplay

Với **Coroutine**, ta thường phải triển khai như sau:

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
        // Khởi chạy hai tác vụ cùng lúc
        StartCoroutine(LoadLevel(OnLevelLoaded));
        StartCoroutine(LoadProfile(OnProfileLoaded));

        // Chờ cả hai hoàn thành
        yield return new WaitUntil(() => _levelLoaded && _profileLoaded);

        // Khởi tạo gameplay
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

Với **UniTask**, đoạn code trên thu gọn lại như sau:

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
            // Chạy đồng thời và chờ cả hai hoàn thành
            var (level, profile) = await UniTask.WhenAll(
                LoadLevelAsync(token),
                LoadProfileAsync(token)
            );

            // Khởi tạo gameplay
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

Nhìn vào hai phiên bản, ta thấy ngay 3 điểm yếu cố hữu của Coroutine:

- **Không trả về giá trị trực tiếp:** Coroutine phải trả về `IEnumerator`, nên muốn lấy `LevelData` hay `PlayerProfile`
  ra ngoài thì phải vòng qua callback và hàng loạt biến cờ trung gian (`_levelLoaded`, `_profileLoaded`).
- **Không `try/catch` quanh `yield` được:** C# không cho phép đặt `yield return` bên trong khối `try-catch`. Nếu
  `LoadLevel` gặp lỗi, việc gom và xử lý lỗi tập trung ở hàm cha rất khó chịu.
- **Tạo rác bộ nhớ (GC allocation):** Mỗi lần gọi `StartCoroutine` hay `new WaitForSeconds(...)` (nếu không cache) đều
  phát sinh cấp phát bộ nhớ trên heap, góp phần gây khựng frame khi Garbage Collector chạy.

## 2. Vì sao không dùng luôn `Task` của .NET?

Nếu C# đã có sẵn `System.Threading.Tasks.Task`, tại sao cộng đồng Unity không dùng thẳng nó mà lại cần UniTask? Có 3 lý
do thực tế:

- **Zero-allocation (không tạo rác bộ nhớ):** `Task` là `class`, mỗi tác vụ bất đồng bộ thường phát sinh cấp phát trên
  heap. Trong khi đó `UniTask` là `readonly struct` kết hợp object pool nội bộ, giúp luồng chạy thông thường gần như
  không tạo rác cho GC.
- **Chạy trên `PlayerLoop` của Unity, không nhảy thread:** `Task` gắn với .NET `ThreadPool` và `SynchronizationContext`.
  Khi dùng thiếu cẩn thận, code rất dễ nhảy sang background thread rồi văng lỗi *"can only be called from the main
  thread"* lúc đụng vào `Transform`, `GameObject`, hay gây lỗi trên **WebGL** (nơi đa luồng bị hạn chế). UniTask mặc
  định chạy hoàn toàn trên main thread thông qua Unity `PlayerLoop` (và vẫn cho phép chủ động chuyển sang `ThreadPool`
  khi thực sự cần tính toán nặng).
- **Tích hợp sẵn cho Unity:** Bạn có thể `await` trực tiếp `AsyncOperation`, `UnityWebRequest`, `WaitUntil`,
  `WaitForFixedUpdate` hay sự kiện UI mà không cần viết wrapper thủ công.

## 3. Cài đặt và 3 kiểu trả về cơ bản

Bạn có thể cài UniTask nhanh qua **Unity Package Manager** (*Add package from git URL...*):

```text
https://github.com/Cysharp/UniTask.git?path=src/UniTask/Assets/Plugins/UniTask
```


Khi mới dùng UniTask, bạn chỉ cần nắm 3 kiểu trả về chính:

- **`UniTask`:** Tác vụ bất đồng bộ **không** trả về giá trị (tương đương `Task`). Dùng khi nơi gọi cần `await` để chờ
  nó làm xong.
- **`UniTask<T>`:** Tác vụ trả về một giá trị kiểu `T` (tương đương `Task<T>`), như `LoadLevelAsync` ở ví dụ trên trả về
  `UniTask<LevelData>`.
- **`UniTaskVoid` (và `.Forget()`):** Dùng cho các hàm **fire-and-forget** — tức là gọi chạy từ `Start()`, `Update()`
  hoặc event handler nơi bạn không thể `await`.

> **Lưu ý:** Đừng dùng `async void` thuần của C# trong Unity. `async void` bám vào `SynchronizationContext`, phát sinh
> cấp phát bộ nhớ và dễ làm exception bị nuốt hoặc khó kiểm soát. Hãy dùng `async UniTaskVoid` cho hàm chỉ chạy không
> cần
> chờ, hoặc giữ kiểu `UniTask` rồi gọi `.Forget()` tại nơi kích hoạt (như trong `Start()` ở Mục 1) để vừa tránh cảnh báo
> biên dịch `CS4014`, vừa thể hiện rõ chủ đích "chạy và không chờ kết quả".

## 4. Bảng chuyển đổi nhanh: từ Coroutine sang UniTask

Dưới đây là những thao tác thay thế hằng ngày khi chuyển từ Coroutine sang UniTask:

| Coroutine                                           | UniTask                                                                                       | Ghi chú                                                                                   |
|-----------------------------------------------------|-----------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------|
| `yield return null;`                                | `await UniTask.NextFrame(token);`                                                             | Luôn sang frame kế tiếp                                                                   |
| `yield return null;` *(linh hoạt pha)*              | `await UniTask.Yield(token);`                                                                 | Nếu gọi trước pha `Update` trong cùng frame, có thể chạy ngay trong `Update` của frame đó |
| `yield return new WaitForSeconds(2f);`              | `await UniTask.Delay(TimeSpan.FromSeconds(2), cancellationToken: token);`                     | Chịu ảnh hưởng của `Time.timeScale`                                                       |
| `yield return new WaitForSecondsRealtime(2f);`      | `await UniTask.Delay(TimeSpan.FromSeconds(2), DelayType.Realtime, cancellationToken: token);` | Chạy theo thời gian thực, bỏ qua `Time.timeScale`                                         |
| `yield return new WaitForFixedUpdate();`            | `await UniTask.WaitForFixedUpdate(token);`                                                    | Chờ tới pha `FixedUpdate`                                                                 |
| `yield return new WaitUntil(() => isReady);`        | `await UniTask.WaitUntil(() => isReady, cancellationToken: token);`                           | Kiểm tra điều kiện mỗi frame giống `WaitUntil`                                            |
| `yield return SceneManager.LoadSceneAsync("Game");` | `await SceneManager.LoadSceneAsync("Game").ToUniTask(cancellationToken: token);`              | Có thể truyền thêm `IProgress<float>` để cập nhật thanh loading                           |

Bên cạnh `UniTask.WhenAll` để chờ tất cả cùng xong, UniTask còn có **`UniTask.WhenAny`** — cực kỳ hữu ích khi hai điều
kiện "đua" với nhau (ví dụ: chờ cutscene chạy xong **hoặc** người chơi bấm nút Skip):

```csharp
private async UniTask PlayCutsceneWithSkipAsync(CancellationToken outerToken)
{
    using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(outerToken);

    int winner = await UniTask.WhenAny(
        PlayCutsceneAsync(linkedCts.Token),
        skipButton.OnClickAsync(linkedCts.Token)
    );

    // Hủy nhánh còn lại ngay khi có một nhánh hoàn thành trước
    linkedCts.Cancel();

    if (winner == 1)
    {
        StopCutsceneImmediately();
    }
}
```

> **Chi tiết nhỏ:** `UniTask.WhenAny` trả kết quả ngay khi có **một** nhánh xong, nhưng không tự hủy các nhánh còn lại.
> Vì vậy việc tạo `linkedCts` rồi gọi `linkedCts.Cancel()` ngay sau `WhenAny` giúp nhánh thua dừng lại tức thì thay vì
> chạy âm thầm cho tới hết.

## 5. Quản lý vòng đời với `CancellationToken`

Đây là điểm khác biệt **quan trọng nhất** giữa Coroutine và UniTask.

Với Coroutine, khi `GameObject` bị `Destroy` hoặc tắt đi, Unity tự động dừng mọi Coroutine gắn trên `MonoBehaviour` đó.
Ngược lại, một hàm `async UniTask` thực chất là state machine C# được `PlayerLoop` đẩy tiến độ. Nếu `GameObject` bị hủy
giữa lúc đang `await`, tác vụ **vẫn chạy tiếp** và sẽ văng `MissingReferenceException` ngay khi đụng tới `transform` hay
component trên object đã mất.

### Cách 1: Gắn chặt với vòng đời `Destroy` của `MonoBehaviour`

Với mọi tác vụ gắn liền một `MonoBehaviour`, hãy truyền `this.GetCancellationTokenOnDestroy()` ngay từ điểm gọi đầu
tiên (như `Start()` ở Mục 1):

```csharp
var token = this.GetCancellationTokenOnDestroy();
await UniTask.Delay(TimeSpan.FromSeconds(2), cancellationToken: token);
```

*(Từ Unity 2022.2 trở lên, `MonoBehaviour` cũng có sẵn property `destroyCancellationToken` với ý nghĩa tương tự.)*

### Cách 2: Hủy chủ động bằng `CancellationTokenSource`

Trong gameplay thực tế, có những lúc bạn cần **hủy tác vụ trước khi object bị Destroy** — ví dụ nhân vật trúng đòn lần 2
khi hiệu ứng nhấp nháy của lần 1 chưa hết, hoặc nhân vật bị stun giữa lúc đang vận chiêu:

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
        // Hủy lượt nhấp nháy trước (nếu còn đang chạy) để bắt đầu lượt mới
        CancelFlash();

        // Gộp token hủy chủ động với token Destroy của GameObject
        _flashCts = CancellationTokenSource.CreateLinkedTokenSource(
            this.GetCancellationTokenOnDestroy()
        );

        FlashAsync(_flashCts.Token).Forget();
    }

    private async UniTaskVoid FlashAsync(CancellationToken token)
    {
        spriteRenderer.color = hitColor;

        // Tránh văng exception khi bị hủy: chỉ cần kiểm tra bool isCanceled
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

**`.SuppressCancellationThrow()`**: thay vì phải bọc `try/catch (OperationCanceledException)` khắp nơi (làm rối luồng
đọc và tốn chi phí ném exception), các API của UniTask trả thẳng về `bool isCanceled` (hoặc
`(bool isCanceled, T result)` với `UniTask<T>`).

> **Lưu ý với Object Pooling:** `GetCancellationTokenOnDestroy()` chỉ kích hoạt khi object bị `Destroy`, **không** kích
> hoạt khi gọi `gameObject.SetActive(false)`. Nếu object được tái sử dụng qua Object Pool, bạn nên gọi `CancelFlash()` ở
`OnDisable()` (và nhớ trả màu về `_originalColor` khi reset trạng thái).

## 6. Kiểm soát thời điểm chạy với `PlayerLoopTiming`

Unity chia mỗi frame thành nhiều pha nối tiếp nhau (`Initialization`, `EarlyUpdate`, `FixedUpdate`, `Update`,
`PreLateUpdate`, `LastPostLateUpdate`...). Coroutine chỉ cho bạn vài điểm dừng cố định, trong khi hầu hết API của
UniTask đều nhận tham số `PlayerLoopTiming`.

Ví dụ, nếu một chuỗi hành động UI/input cần nhảy vào đúng pha vật lý trước khi tác động lực lên `Rigidbody`, bạn chỉ
cần:

```csharp
private async UniTask ApplyDelayedImpulseAsync(Rigidbody rb, Vector3 force, CancellationToken token)
{
    await UniTask.Delay(TimeSpan.FromSeconds(0.5f), cancellationToken: token);

    // Chuyển sang pha FixedUpdate trước khi tác động vật lý
    await UniTask.Yield(PlayerLoopTiming.FixedUpdate, token);
    rb.AddForce(force, ForceMode.Impulse);
}
```

## 7. Những lỗi thường gặp (và khi nào không nên dùng UniTask)

- **Quên truyền `CancellationToken`:** Lỗi phổ biến nhất khi mới chuyển từ Coroutine sang. Hậu quả là đổi scene hoặc hủy
  prefab xong mà logic cũ vẫn chạy tiếp âm thầm rồi báo lỗi `MissingReferenceException`.
- **`await` cùng một biến `UniTask` hai lần:** Để đạt zero-allocation, các `UniTask` được tái sử dụng qua pool nội bộ
  ngay sau khi `await` xong. Nếu bạn lưu `var task = LoadAsync();` rồi `await task;` ở hai chỗ khác nhau, lần thứ hai sẽ
  ném `InvalidOperationException`. Khi thực sự cần `await` lại nhiều lần, hãy gọi `.Preserve()` trên task đó.
- **Dùng `async void` thay cho `async UniTaskVoid`:** Dễ làm lỗi thoát khỏi kiểm soát của UniTask và phát sinh rác bộ
  nhớ.
- **Bỏ quên exception trong `.Forget()`:** Vì không ai `await` kết quả, mọi lỗi không được `try/catch` bên trong hàm
  chạy `.Forget()` sẽ đi thẳng tới `UniTaskScheduler.UnobservedTaskException`. Hãy luôn bắt lỗi cho tác vụ quan trọng (
  như gọi API mạng) hoặc đăng ký log cho event này.
- **Biến UniTask thành `Update()` trá hình:** Dùng vòng lặp
  `while (!token.IsCancellationRequested) { ... await UniTask.Yield(token); }` cho logic chạy liên tục mọi frame không
  nhẹ hơn `Update()` thuần; trái lại còn thêm chi phí state machine và kiểm tra token mỗi frame. Hãy giữ `Update()` cho
  hành vi chạy liên tục theo frame, và dùng UniTask cho các luồng có điểm bắt đầu — chờ đợi — kết thúc rõ ràng.

## 8. Đi xa hơn với UniTask

Khi đã quen với `UniTask`, `.Forget()` và `CancellationToken`, bạn có thể khai thác thêm những tính năng rất mạnh khác
của thư viện này cho dự án thực tế:

- **Tích hợp sẵn hệ sinh thái Unity:** Hỗ trợ `await` trực tiếp cho **DOTween** (chờ tween hoàn thành mà không cần
  callback `OnComplete`), **Addressables**, và các sự kiện uGUI (`OnClickAsync`).
- **`IUniTaskAsyncEnumerable` và `Channel`:** Xử lý luồng sự kiện hoặc hàng đợi bất đồng bộ theo phong cách reactive.
- **UniTask Tracker (`Window -> UniTask Tracker`):** Công cụ có sẵn trong Unity Editor giúp soi danh sách mọi UniTask
  đang chạy và stack trace nơi khởi tạo — cực kỳ hữu ích để săn các task bị "quên hủy" (leak).

## Tóm tắt

- **UniTask** thay thế Coroutine bằng `async/await` sạch sẽ: trả giá trị trực tiếp, dùng được `try/catch`, ghép song
  song dễ dàng với `WhenAll` / `WhenAny`.
- Khác với `Task` của .NET, UniTask là `readonly struct` chạy trên Unity `PlayerLoop` nên tránh cấp phát rác GC và an
  toàn với main thread.
- Dùng `UniTask` / `UniTask<T>` khi cần `await`, và `async UniTaskVoid` (hoặc `.Forget()`) cho fire-and-forget.
- **Luôn truyền `CancellationToken`** (`GetCancellationTokenOnDestroy()` hoặc `CancellationTokenSource`) và tận dụng
  `.SuppressCancellationThrow()` để hủy tác vụ gọn nhẹ.
- Mỗi `UniTask` mặc định chỉ `await` được **một lần** (muốn dùng lại phải `.Preserve()`), và đừng lạm dụng UniTask để
  thay thế `Update()`.

## Tham khảo

- Cysharp/UniTask GitHub repository: https://github.com/Cysharp/UniTask
- Unity Manual: *Coroutines* và *Order of execution for event functions / PlayerLoop*
