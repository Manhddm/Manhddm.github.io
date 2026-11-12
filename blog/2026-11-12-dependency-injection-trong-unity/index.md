---
slug: dependency-injection-trong-unity
title: "Dependency Injection trong Unity: viết code dễ thay, dễ test"
authors: [Manhddm]
tags: [unity, csharp, architecture, dependency-injection]
---

Nếu code của bạn đầy `AudioManager.Instance`, `GameManager.Instance` và `FindAnyObjectByType<...>()`, bài này dành cho bạn. Chúng ta sẽ tìm hiểu Dependency Injection (DI) là gì, vì sao nó giúp dự án Unity dễ bảo trì hơn, và cách áp dụng **không cần framework nào**.

{/* truncate */}


## 1. Vấn đề: các class "bám dính" vào nhau

Xem đoạn code quen thuộc này:

```csharp
public class PlayerHealth : MonoBehaviour
{
    private int _hp = 100;

    public void TakeDamage(int amount)
    {
        _hp -= amount;
        AudioManager.Instance.PlaySfx("hit");
    }
}
```

Trông vô hại, nhưng `PlayerHealth` đang **tự đi tìm dependency** thông qua
`AudioManager.Instance`. Nó không chỉ biết API cần gọi là `PlaySfx`, mà còn biết
class cụ thể `AudioManager` và cơ chế truy cập Singleton. Hệ quả:

- **Hidden dependency:** nhìn vào Inspector hay class signature, không ai biết `PlayerHealth` cần một audio service. Chỉ khi đọc từng dòng code mới phát hiện ra.
- **Khó test:** muốn test `TakeDamage` thì phải có một `AudioManager` thật trong scene.
- **Khó thay đổi:** nếu chỉ thay implementation bên trong `AudioManager` thì caller không cần sửa. Nhưng nếu thay hẳn `AudioManager` bằng một service khác, mọi nơi gọi `AudioManager.Instance` đều phải biết và thay đổi theo.

## 2. Dependency Injection là gì?

Ý tưởng cốt lõi:

> **Một class không tự tạo hay tự đi tìm thứ nó cần. Thứ đó được "đưa vào" từ bên ngoài.**

"Thứ nó cần" gọi là **dependency** (phụ thuộc). "Đưa vào" gọi là **injection** (tiêm). Thay vì `PlayerHealth` tự lấy service qua `AudioManager.Instance`, một nơi bên ngoài sẽ chọn implementation phù hợp và đưa cho nó một đối tượng có khả năng phát âm thanh.

Thú vị là bạn **đã dùng DI rồi** mà không biết: mỗi lần kéo thả một object vào trường `[SerializeField]` trong Inspector, dependency được cung cấp từ bên ngoài thay vì class tự đi tìm. Cách này thường gọi là **Inspector injection**: bạn chọn reference trong Editor, Unity lưu và khôi phục nó qua hệ thống serialization.

## 3. Bước 1: tách dependency khỏi implementation cụ thể

DI **không bắt buộc** phải có interface: một constructor nhận `AudioService` cụ thể vẫn là DI, vì dependency được đưa vào từ bên ngoài. Nhưng kết hợp DI với abstraction (interface hoặc abstract class) giúp thay implementation và viết test dễ hơn nhiều, nên ta tạo một interface:

```csharp
public interface IAudioService
{
    void PlaySfx(string id);
}
```

```csharp
using UnityEngine;

public class AudioService : MonoBehaviour, IAudioService
{
    [SerializeField] private AudioSource source;
    [SerializeField] private AudioClip hitClip;

    public void PlaySfx(string id)
    {
        if (id == "hit") source.PlayOneShot(hitClip);
    }
}
```

Giờ `PlayerHealth` chỉ cần biết "có thứ gì đó phát được âm thanh", không cần biết đó là `AudioService`, FMOD hay một **fake** để test.

## 4. Bước 2: inject dependency vào MonoBehaviour

Về mặt C#, MonoBehaviour vẫn có constructor, nhưng **Unity** mới là bên gọi nó (khi `AddComponent`, khi load scene hay prefab), nên bạn không truyền tham số vào được và cũng không nên khởi tạo gì trong đó. Vì vậy với MonoBehaviour ta dùng **method injection**: một hàm `Construct` nhận dependency.

```csharp
using UnityEngine;

public class PlayerHealth : MonoBehaviour
{
    [SerializeField] private int maxHp = 100;

    private int _hp;
    private IAudioService _audio;

    public void Construct(IAudioService audio)
    {
        _audio = audio;
    }

    private void Awake()
    {
        _hp = maxHp;
    }

    public void TakeDamage(int amount)
    {
        if (amount <= 0) return; // sát thương âm không được phép hồi máu

        _hp = Mathf.Max(_hp - amount, 0);
        _audio.PlaySfx("hit");
    }
}
```

Tại sao không dùng `[SerializeField] IAudioService`? Vì Inspector của Unity **không serialize được interface** theo mặc định. Hàm `Construct` là cách đơn giản nhất để vượt qua giới hạn này.

> **Lưu ý:** `[SerializeReference]` có hỗ trợ field kiểu interface, nhưng chỉ cho object C# thường. Nó **không** giữ được reference tới object kế thừa `UnityEngine.Object` như MonoBehaviour hay ScriptableObject, nên không giúp được trường hợp `AudioService` ở trên.

## 5. Bước 3: Composition Root, nơi "lắp ráp" mọi thứ

Ai sẽ gọi `Construct`? Ta tạo một nơi duy nhất chịu trách nhiệm nối các dependency với nhau, gọi là **Composition Root** (hay *Installer*):

```csharp
using UnityEngine;

[DefaultExecutionOrder(-100)]
public class GameInstaller : MonoBehaviour
{
    [SerializeField] private AudioService audioService;
    [SerializeField] private PlayerHealth player;

    private void Awake()
    {
        // Kiểm tra qua kiểu AudioService (không phải IAudioService) để dùng toán tử == của Unity:
        // field chưa gán trong Editor là một "fake null" mà phép so sánh qua interface không phát hiện được.
        if (audioService == null || player == null)
        {
            Debug.LogError("GameInstaller: chưa gán đủ reference trong Inspector.", this);
            return;
        }

        player.Construct(audioService);
    }
}
```

Kiểm tra null đặt ở Installer là **fail-fast**: thiếu reference thì báo lỗi ngay khi vào scene, chỉ đúng object bị thiếu, thay vì đợi tới lúc nhân vật trúng đòn mới văng `NullReferenceException`.

Về `[DefaultExecutionOrder(-100)]`: với các object có sẵn trong scene, Unity gọi `Awake` của mọi script trước `Start`, nên nếu `PlayerHealth` chỉ dùng `_audio` từ `Start` trở đi (như ví dụ trên, `Awake` của nó không đụng tới `_audio`) thì inject trong `GameInstaller.Awake` là đủ. Attribute này chỉ cần khi component **dùng dependency ngay trong `Awake`**: nó cho `GameInstaller` chạy trước các script có execution order mặc định (0). Nó không phải "luôn chạy trước tất cả": script có order nhỏ hơn -100 vẫn chạy trước nó.

Giờ việc khởi tạo và kết nối dependency tập trung tại **một nơi**. Muốn thay `AudioService` bằng implementation khác, bạn chỉ sửa phần cấu hình ở Composition Root (kiểu field và reference được gán), thay vì sửa mọi class đang dùng audio. Trong ví dụ nhỏ này một `GameInstaller` là đủ; dự án lớn thường chia thành nhiều Installer theo từng phạm vi (scene, hệ thống gameplay…).

### Object tạo lúc runtime bằng `Instantiate`

Đây là chỗ hay vấp: `Instantiate` gọi `Awake` và `OnEnable` của prefab **ngay bên trong** lệnh `Instantiate`, tức là **trước** khi bạn kịp gọi `Construct`:

```csharp
var player = Instantiate(playerPrefab); // Awake + OnEnable đã chạy xong ở đây
player.Construct(audioService);         // quá muộn nếu Awake/OnEnable cần _audio
```

`Start` thì chạy sau, nên dùng dependency từ `Start` trở đi là an toàn. Nếu bắt buộc phải dùng trong `Awake`/`OnEnable`, hãy tạo object dưới một parent đang tắt, inject, rồi mới đưa nó ra:

```csharp
// inactiveRoot là một GameObject đang SetActive(false)
var player = Instantiate(playerPrefab, inactiveRoot); // chưa active → Awake/OnEnable chưa chạy
player.Construct(audioService);
player.transform.SetParent(null);                     // active trong scene → Awake/OnEnable chạy, _audio đã có
```

## 6. Với class C# thuần: constructor injection

Logic game không cần là MonoBehaviour. Với class C# thường, cách DI chuẩn nhất là truyền qua constructor:

```csharp
public interface IRandomProvider
{
    float Value { get; } // trong khoảng [0, 1]
}

public class UnityRandomProvider : IRandomProvider
{
    public float Value => UnityEngine.Random.value;
}

public class DamageCalculator
{
    private readonly IRandomProvider _random;

    public DamageCalculator(IRandomProvider random)
    {
        _random = random ?? throw new System.ArgumentNullException(nameof(random));
    }

    // critChance trong khoảng [0, 1]
    public int Calculate(int baseDamage, float critChance)
    {
        return _random.Value < critChance ? baseDamage * 2 : baseDamage;
    }
}
```

Constructor kèm kiểm tra null đảm bảo `DamageCalculator` không thể được tạo ra trong trạng thái thiếu dependency (`new DamageCalculator(null)` sẽ ném lỗi ngay). Còn `readonly` đảm bảo dependency không bị gán lại sau đó. Kết hợp hai thứ này là dạng DI an toàn nhất.

> Chi tiết nhỏ: `UnityEngine.Random.value` có thể trả về **đúng** `1.0`, nên với `critChance = 1f` vẫn có một xác suất cực nhỏ không ra crit. Với ví dụ minh họa thì không đáng kể; nếu cần chính xác tuyệt đối, hãy quy định `Value` nằm trong `[0, 1)` và cho implementation tuân thủ điều đó.

## 7. Phần thưởng lớn nhất: viết được unit test

Vì `DamageCalculator` không phụ thuộc trực tiếp vào `UnityEngine.Random`, ta có thể "giả" nó để kiểm soát kết quả. Với Unity Test Framework (NUnit):

```csharp
using NUnit.Framework;

public class DamageCalculatorTests
{
    private class FakeRandom : IRandomProvider
    {
        public float Value { get; set; }
    }

    [Test]
    public void Crit_DoublesDamage()
    {
        var calc = new DamageCalculator(new FakeRandom { Value = 0f });
        Assert.AreEqual(20, calc.Calculate(10, 0.5f));
    }

    [Test]
    public void NoCrit_KeepsBaseDamage()
    {
        var calc = new DamageCalculator(new FakeRandom { Value = 0.9f });
        Assert.AreEqual(10, calc.Calculate(10, 0.5f));
    }
}
```

Không cần mở scene, không cần nhấn Play, không phụ thuộc vào may rủi. Test chạy rất nhanh vì không cần khởi tạo scene, GameObject hay chạy gameplay.

## 8. Những lỗi thường gặp

- **Lạm dụng interface:** không phải class nào cũng cần interface. Chỉ tạo khi bạn thực sự cần thay thế (test, đổi implementation).
- **Quên thứ tự khởi tạo:** dùng dependency trong `Awake` của chính class được tiêm có thể bị null nếu Installer chưa chạy. Ưu tiên dùng dependency từ `Start` trở đi, hoặc đặt `DefaultExecutionOrder` cho Installer.
- **Biến Installer thành Service Locator:** nếu mọi class đều gọi `GameInstaller.Get<IAudioService>()`, bạn chỉ đang đổi tên Singleton. DI đúng nghĩa là dependency được **đưa vào**, không phải **đi lấy**.
- **Áp dụng cho game jam 48 giờ:** DI có chi phí thiết lập. Với prototype nhỏ, Singleton đôi khi là lựa chọn thực dụng hơn.

## 9. Khi dự án lớn hơn: DI framework

Khi số lượng dependency tăng lên, việc tự viết `Construct` cho từng object sẽ mệt. Lúc đó có thể cân nhắc các DI container phổ biến trong cộng đồng Unity như **VContainer**, **Zenject/Extenject** hoặc **Reflex**. Chúng tự động hóa những gì bạn vừa làm thủ công ở trên, đồng thời quản lý thêm lifetime (singleton, transient…), scope theo scene và cả đồ thị object phức tạp.

Lời khuyên: hãy hiểu cách làm thủ công trước. Khi đã nắm được Composition Root và các kiểu injection, bạn sẽ dùng framework một cách có chủ đích thay vì "phép thuật".

## Tóm tắt

- DI = class nhận dependency từ bên ngoài thay vì tự tìm.
- MonoBehaviour → method injection (`Construct`) hoặc Inspector (`[SerializeField]`).
- Class C# thuần → constructor injection.
- Gom việc lắp ráp vào một **Composition Root**.
- Lợi ích lớn nhất: code dễ thay đổi và **test được**.

## Tham khảo

- Unity Manual: *Script execution order* và `DefaultExecutionOrder`
- Unity Test Framework documentation
- Mark Seemann, *Dependency Injection: Principles, Practices, and Patterns*
