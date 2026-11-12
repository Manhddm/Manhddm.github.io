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

Trông vô hại, nhưng `PlayerHealth` đang **tự đi tìm** thứ nó cần. Hệ quả:

- **Hidden dependency:** nhìn vào Inspector hay class signature, không ai biết `PlayerHealth` cần `AudioManager`. Chỉ khi đọc từng dòng code mới phát hiện ra.
- **Khó test:** muốn test `TakeDamage` thì phải có một `AudioManager` thật trong scene.
- **Khó thay đổi:** muốn đổi sang hệ thống âm thanh khác (FMOD, Wwise…) thì phải sửa mọi nơi gọi `AudioManager.Instance`.

## 2. Dependency Injection là gì?

Ý tưởng cốt lõi:

> **Một class không tự tạo hay tự đi tìm thứ nó cần. Thứ đó được "đưa vào" từ bên ngoài.**

"Thứ nó cần" gọi là **dependency** (phụ thuộc). "Đưa vào" gọi là **injection** (tiêm). Thay vì `PlayerHealth` tự gọi `AudioManager.Instance`, sẽ có ai đó đưa cho nó một đối tượng phát âm thanh.

Thú vị là bạn **đã dùng DI rồi** mà không biết: mỗi lần kéo thả một object vào trường `[SerializeField]` trong Inspector, đó chính là injection. Unity là bên "inject" dependency vào component của bạn.

## 3. Bước 1: phụ thuộc vào interface, không phụ thuộc vào class cụ thể

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

MonoBehaviour **không có constructor** (Unity tự tạo nó), nên ta dùng **method injection**: một hàm `Construct` nhận dependency.

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
        _hp = Mathf.Max(_hp - amount, 0);
        _audio.PlaySfx("hit");
    }
}
```

Tại sao không dùng `[SerializeField] IAudioService`? Vì Inspector của Unity **không serialize được interface** theo mặc định. Hàm `Construct` là cách đơn giản nhất để vượt qua giới hạn này.

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
        player.Construct(audioService);
    }
}
```

Lưu ý `[DefaultExecutionOrder(-100)]`: nó đảm bảo `GameInstaller.Awake` chạy **trước** các script khác, để khi `PlayerHealth` bắt đầu hoạt động, dependency đã sẵn sàng. Quên dòng này là nguồn gốc của rất nhiều `NullReferenceException` khó hiểu.

Giờ mọi mối quan hệ giữa các hệ thống nằm gọn trong **một file**. Muốn đổi hệ thống âm thanh? Chỉ sửa `GameInstaller`.

## 6. Với class C# thuần: constructor injection

Logic game không cần là MonoBehaviour. Với class C# thường, cách DI chuẩn nhất là truyền qua constructor:

```csharp
public interface IRandomProvider
{
    float Value { get; }
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
        _random = random;
    }

    public int Calculate(int baseDamage, float critChance)
    {
        return _random.Value < critChance ? baseDamage * 2 : baseDamage;
    }
}
```

`readonly` + constructor đảm bảo `DamageCalculator` **không bao giờ** tồn tại mà thiếu dependency. Đây là dạng DI an toàn nhất.

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

Không cần mở scene, không cần nhấn Play, không phụ thuộc vào may rủi. Test chạy trong vài mili giây.

## 8. Những lỗi thường gặp

- **Lạm dụng interface:** không phải class nào cũng cần interface. Chỉ tạo khi bạn thực sự cần thay thế (test, đổi implementation).
- **Quên thứ tự khởi tạo:** dùng dependency trong `Awake` của chính class được tiêm có thể bị null nếu Installer chưa chạy. Ưu tiên dùng dependency từ `Start` trở đi, hoặc đặt `DefaultExecutionOrder` cho Installer.
- **Biến Installer thành Service Locator:** nếu mọi class đều gọi `GameInstaller.Get<IAudioService>()`, bạn chỉ đang đổi tên Singleton. DI đúng nghĩa là dependency được **đưa vào**, không phải **đi lấy**.
- **Áp dụng cho game jam 48 giờ:** DI có chi phí thiết lập. Với prototype nhỏ, Singleton đôi khi là lựa chọn thực dụng hơn.

## 9. Khi dự án lớn hơn: DI framework

Khi số lượng dependency tăng lên, việc tự viết `Construct` cho từng object sẽ mệt. Lúc đó có thể cân nhắc các DI container phổ biến trong cộng đồng Unity như **VContainer**, **Zenject/Extenject** hoặc **Reflex**. Chúng tự động hóa đúng những gì bạn vừa làm thủ công ở trên.

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