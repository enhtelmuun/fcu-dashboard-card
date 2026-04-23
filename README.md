# FCU Dashboard Card

RS485 Modbus Fan Coil Unit (FCU) төхөөрөмжүүдийг Home Assistant дээр хянах Lovelace карт.

![preview](preview.png)

## Онцлог

- FCU 6 хүртэл төхөөрөмжийг нэг дэлгэцэд харуулна
- Горим: Хэрэглэлт / Халаалт / Агааржуулалт
- Орчны температур, тохируулга температур
- Сэнсний хурд (1-5 шат), Manual/Auto горим
- Register 24 алдааны битүүд (7 алдааны мэдээлэл)
- Ажиллаж байгаа / Унтраалттай / Алдаатай тоолуур

## Суулгах

### HACS ашиглан
1. HACS → Integrations → ⋮ → Custom repositories
2. URL: `https://github.com/ТААНЫ/fcu-dashboard-card`
3. Category: `Dashboard`
4. ADD дарна

### Гараар суулгах
`fcu-dashboard-card.js` файлыг `config/www/` хавтаст хуулна.

## Тохиргоо

```yaml
type: custom:fcu-dashboard-card
title: "FCU Хяналтын самбар"
slaves:
  - id: 2
    name: "FCU 1"
  - id: 3
    name: "FCU 2"
  - id: 4
    name: "FCU 3"
  - id: 5
    name: "FCU 4"
  - id: 6
    name: "FCU 5"
  - id: 7
    name: "FCU 6"
```

## Modbus тохиргоо (configuration.yaml)

```yaml
modbus:
  - name: fcu_bus
    type: rtu
    port: /dev/ttyUSB0
    baudrate: 9600
    bytesize: 8
    parity: N
    stopbits: 1
    sensors:
      - name: fcu_2_power
        slave: 2
        address: 0
      # ... (README-ийн доор дэлгэрэнгүй)
```

## Register зураглал (RS485 протокол)

| Register | Функц |
|----------|-------|
| 0 | Power (0=off, 1=on) |
| 1 | Mode (0=cool, 1=heat, 2=vent) |
| 2 | Fan speed (1-5) |
| 3 | Fan mode (0=manual, 1=auto) |
| 4 | Set temperature |
| 20 | Ambient temperature |
| 21 | Pipe temperature |
| 22 | Real-time RPM |
| 24 | Alarm bits (bit0-bit6) |
| 25 | Current fan gear |
