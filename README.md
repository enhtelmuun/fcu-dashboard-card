# FCU Dashboard Card

**RS485 Modbus Fan Coil Unit (FCU)** төхөөрөмжүүдийг Home Assistant дээр хянах Lovelace карт.

![preview](preview.png)

---

## ✨ Онцлог

- **Шаардлагатай тоогоор FCU нэмж/хасаж болно** — `fcus:` жагсаалтад нэмэх бүрд карт автоматаар гарна
- **Дээд хэсгийн тоолуур** — Ажиллаж байгаа · Унтраалттай · Алдаатай
- **Горим өнгө:**
  - ❄ Хэрэглэлт — цэнхэр
  - 🔥 Халаалт — улаан
  - 💨 Агааржуулалт — cyan
  - Унтраалттай — саарал
- **Сэнсний хурдны цэг** горимтой нийлж өнгөрнө (1–5 шат)
- **`name:`** талбараар FCU-д дурын нэр өгч болно (жнь: `FCU DIS`)
- **Алдааны хэсэг** — `fault_entity` холбосон бол Register 24-ийн Bit0–Bit6-г тус тусдаа дугуйгаар харуулна
  - 🟢 Ногоон = OK
  - 🔴 Улаан = АЛДАА
  - 🟡 Шар = АНХААРУУЛГА / ИДЭВХТЭЙ
  - `fault_entity` холбоогүй бол алдааны хэсэг огт гарахгүй

---

## 📦 Суулгах

### HACS ашиглан (зөвлөмж)

1. **HACS** → **Frontend** → дээд баруун буланд **⋮** → **Custom repositories**
2. Repository URL: `https://github.com/enhtelmuun/fcu-dashboard-card`
3. Category: `Dashboard`
4. **ADD** → **FCU Dashboard Card** → **Download**
5. Home Assistant-г restart хийнэ

### Гараар суулгах

```bash
fcu-dashboard-card.js  →  config/www/fcu-dashboard-card.js
```

`configuration.yaml` дотор:
```yaml
lovelace:
  resources:
    - url: /local/fcu-dashboard-card.js
      type: module
```

---

## ⚙️ Карт тохиргоо (Dashboard YAML)

```yaml
type: custom:fcu-dashboard-card
title: FCU Хяналтын самбар
fcus:
  - entity: climate.fcu_1
    name: FCU DIS        # ← дурын нэр (заавал биш, үгүй бол entity нэр)
    slave: 2
    fault_entity: sensor.fcu_1_fault_status   # ← Register 24 (заавал биш)
  - entity: climate.fcu_2
    name: FCU 2
    slave: 3
    fault_entity: sensor.fcu_2_fault_status
  - entity: climate.fcu_3
    name: FCU 3
    slave: 4
    fault_entity: sensor.fcu_3_fault_status
  - entity: climate.fcu_4
    name: FCU 4
    slave: 5
    fault_entity: sensor.fcu_4_fault_status
  - entity: climate.fcu_5
    name: FCU 5
    slave: 6
    fault_entity: sensor.fcu_5_fault_status
  - entity: climate.fcu_6
    name: FCU 6
    slave: 7
    fault_entity: sensor.fcu_6_fault_status
```

| Талбар | Заавал | Тайлбар |
|--------|--------|---------|
| `entity` | ✅ | Home Assistant climate entity |
| `name` | ❌ | Карт дотор харуулах нэр (үгүй бол entity-н нэр) |
| `slave` | ❌ | RS485 slave ID (sub-text болж харагдана) |
| `fault_entity` | ❌ | Register 24 sensor — алдааны хэсэг харуулна |

> FCU нэмэхдээ `fcus:` жагсаалтад мөр нэмнэ. Хасахдаа тухайн мөрийг устгана. Тоолуур автоматаар шинэчлэгдэнэ.

---

## 🔧 configuration.yaml — Modbus тохиргоо

### Climate entity (FCU хянах)

```yaml
modbus:
  - name: modbus_gateway
    type: tcp
    host: 10.1.1.3        # RS485→TCP gateway IP
    port: 502
    timeout: 5
    delay: 2
    message_wait_milliseconds: 200

    climates:
      - name: FCU 1
        slave: 2
        temperature_unit: C
        temp_step: 1
        max_temp: 55
        min_temp: 5
        data_type: int16
        address: 20                  # Орчны температур (addr 20)
        target_temp_register: 4      # Тохируулга температур (addr 4)
        hvac_onoff_register: 0       # Power on/off (addr 0)
        hvac_mode_register:
          address: 1
          values:
            state_cool: 0            # Хэрэглэлт
            state_heat: 1            # Халаалт
            state_fan_only: 2        # Агааржуулалт
        fan_mode_register:
          address: 2
          values:
            state_fan_low: 1         # 1-р шат
            state_fan_medium: 3      # 3-р шат
            state_fan_middle: 4      # 4-р шат
            state_fan_high: 5        # 5-р шат
      # FCU 2 (slave: 3), FCU 3 (slave: 4) ... адилаар үргэлжлүүлнэ
```

### Fault Status sensor (Register 24)

```yaml
    sensors:
      - name: FCU 1 Fault Status
        slave: 2
        address: 24
        input_type: holding
        data_type: int16
      - name: FCU 2 Fault Status
        slave: 3
        address: 24
        input_type: holding
        data_type: int16
      # FCU 3–6 адилаар...
```

### Template sensor — алдааны bit entity (заавал биш)

Register 24-ийн bit бүрийг тусдаа entity болгохын тулд:

```yaml
template:
  - sensor:
      - name: "FCU 1 Орчны сенсор алдаа"
        unique_id: fcu1_fault_bit0
        state: >
          {{ 'АЛДАА' if states('sensor.fcu_1_fault_status') | int(0) | bitwise_and(1) else 'OK' }}
        icon: mdi:thermometer-alert
      - name: "FCU 1 Хоолойн сенсор алдаа"
        unique_id: fcu1_fault_bit1
        state: >
          {{ 'АЛДАА' if states('sensor.fcu_1_fault_status') | int(0) | bitwise_and(2) else 'OK' }}
        icon: mdi:pipe-leak
      # ... Bit2–Bit6 адилаар
```

---

## 📋 Register зураглал (RS485 протокол)

| Register | Уншина | Бичнэ | Утга |
|----------|--------|-------|------|
| 0 | ✅ | ✅ | Power: `0`=унтраах · `1`=асаах |
| 1 | ✅ | ✅ | Горим: `0`=Хэрэглэлт · `1`=Халаалт · `2`=Агааржуулалт |
| 2 | ✅ | ✅ | Сэнсний хурд: `1–5` шат |
| 3 | ✅ | ✅ | Хурдны горим: `0`=гараар · `1`=автомат |
| 4 | ✅ | ✅ | Тохируулга температур (°C) |
| 5 | ✅ | ✅ | Температурын доод хязгаар |
| 6 | ✅ | ✅ | Температурын дээд хязгаар |
| 7 | ✅ | ✅ | Хөлдөлтөөс хамгаалах функц |
| 8 | ✅ | ✅ | Хүйтэн салхины тохируулга температур |
| 9 | ✅ | ✅ | Температур хүрэхэд сэнсийг унтраах горим |
| 20 | ✅ | — | Орчны температур (°C) |
| 21 | ✅ | — | Хоолойн температур (°C) |
| 22 | ✅ | — | Одоогийн хурд (rpm) |
| 23 | ✅ | — | Шаардлагатай хурд (rpm) |
| **24** | ✅ | — | **Алдааны бит (Bit0–Bit6)** |
| 25 | ✅ | — | Одоогийн хурдны шат (0–5) |

### Register 24 — Алдааны бит

| Бит | Утга | Төрөл |
|-----|------|-------|
| Bit 0 | Орчны температур сенсорын алдаа | 🔴 Алдаа |
| Bit 1 | Хоолойн температур сенсорын алдаа | 🔴 Алдаа |
| Bit 2 | Хавхлагын гаралт | 🟡 Анхааруулга |
| Bit 3 | Пассив цэгийн хаалт | 🟡 Анхааруулга |
| Bit 4 | Хөлдөлтөөс хамгаалалт идэвхтэй | 🟡 Идэвхтэй |
| Bit 5 | Хүйтэн салхины хамгаалалт идэвхтэй | 🟡 Идэвхтэй |
| Bit 6 | Сэнсний (мотор) алдаа | 🔴 Алдаа |

---

## 📡 Холболтын схем

```
HA Server
   │
   └── Modbus TCP (10.1.1.3:502)
          │
          └── RS485 Gateway
                 ├── FCU 1  (slave 2)  ── 9600bps, N, 8, 1
                 ├── FCU 2  (slave 3)
                 ├── FCU 3  (slave 4)
                 ├── FCU 4  (slave 5)
                 ├── FCU 5  (slave 6)
                 └── FCU 6  (slave 7)
```

---

## 📜 Хувилбарын түүх

| Хувилбар | Өөрчлөлт |
|----------|----------|
| v1.4.0 | Горим өнгө, сэнсний хурд өнгө, алдааны дугуй зүүн тал, fault_entity заавал биш |
| v1.3.0 | Climate entity дэмжлэг, fan mode, ALARM_BITS |
| v1.0.0 | Анхны хувилбар |
