/**
 * FCU Dashboard Card
 * RS485 Modbus Fan Coil Unit хяналтын Lovelace карт
 * Register протокол: 9600bps, N, 8, 1
 *
 * Slave ID-нууд: 2,3,4,5,6,7
 * Гол Register-үүд:
 *   0  = Power (0=off, 1=on)
 *   1  = Mode (0=cool, 1=heat, 2=vent)
 *   2  = Fan speed gear (1-5)
 *   3  = Fan mode (0=manual, 1=auto)
 *   4  = Set temperature
 *   20 = Ambient temperature
 *   21 = Pipe temperature
 *   22 = Real-time RPM
 *   24 = Alarm bits (bit0-bit6)
 *   25 = Current fan gear
 */

const STYLES = `
  :host {
    display: block;
    font-family: var(--primary-font-family, sans-serif);
  }
  .card-root {
    padding: 12px 14px 16px;
  }
  .card-title {
    font-size: 15px;
    font-weight: 500;
    color: var(--primary-text-color);
    margin-bottom: 12px;
  }
  .summary-bar {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 14px;
  }
  .summary-item {
    background: var(--secondary-background-color);
    border-radius: 10px;
    padding: 10px 8px;
    text-align: center;
  }
  .summary-num {
    font-size: 26px;
    font-weight: 500;
    line-height: 1;
  }
  .summary-label {
    font-size: 11px;
    color: var(--secondary-text-color);
    margin-top: 3px;
  }
  .num-on  { color: var(--success-color, #3B6D11); }
  .num-off { color: var(--secondary-text-color); }
  .num-err { color: var(--error-color, #A32D2D); }
  .fcu-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  @media (max-width: 500px) {
    .fcu-grid { grid-template-columns: 1fr; }
  }
  .fcu-card {
    background: var(--card-background-color, #fff);
    border: 1px solid var(--divider-color);
    border-radius: 12px;
    padding: 12px 14px;
    position: relative;
  }
  .fcu-card.status-err {
    border-color: var(--error-color, #E24B4A);
    border-width: 1.5px;
  }
  .fcu-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
  }
  .fcu-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--primary-text-color);
  }
  .fcu-slave {
    font-size: 10px;
    color: var(--secondary-text-color);
    margin-top: 1px;
  }
  .badge {
    font-size: 10px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 99px;
  }
  .badge-on  { background: #EAF3DE; color: #3B6D11; }
  .badge-off { background: var(--secondary-background-color); color: var(--secondary-text-color); }
  .badge-err { background: #FCEBEB; color: #A32D2D; }
  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    margin-bottom: 4px;
  }
  .info-label { color: var(--secondary-text-color); }
  .info-val {
    font-size: 13px;
    font-weight: 500;
    color: var(--primary-text-color);
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .mode-icon { font-size: 13px; }
  .fan-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    margin-bottom: 4px;
  }
  .dots {
    display: flex;
    gap: 3px;
    align-items: center;
  }
  .dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--divider-color);
  }
  .dot.active { background: #378ADD; }
  .fan-mode-label {
    font-size: 10px;
    color: var(--secondary-text-color);
    margin-left: 4px;
  }
  .divider {
    border: none;
    border-top: 1px solid var(--divider-color);
    margin: 8px 0;
  }
  .alarm-title {
    font-size: 10px;
    color: var(--secondary-text-color);
    margin-bottom: 5px;
  }
  .alarm-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    margin-bottom: 3px;
  }
  .alarm-name { color: var(--secondary-text-color); flex: 1; }
  .alarm-status {
    display: flex;
    align-items: center;
    gap: 3px;
    font-weight: 500;
    white-space: nowrap;
  }
  .st-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    display: inline-block;
  }
  .st-ok   { color: var(--success-color, #3B6D11); }
  .st-err  { color: var(--error-color, #A32D2D); }
  .st-warn { color: var(--warning-color, #BA7517); }
  .dot-ok   { background: #639922; }
  .dot-err  { background: #E24B4A; }
  .dot-warn { background: #EF9F27; }
  .unavailable {
    text-align: center;
    color: var(--secondary-text-color);
    font-size: 12px;
    padding: 20px 0;
  }
`;

/* ── Register 24 битийн алдааны тодорхойлолт ── */
const ALARM_BITS = [
  { bit: 0, name: "Орчны температур сенсор" },
  { bit: 1, name: "Хоолойн температур сенсор" },
  { bit: 2, name: "Хавхлагын гаралт" },
  { bit: 3, name: "Пассив цэгийн хаалт" },
  { bit: 4, name: "Хөлдөлтөөс хамгаалалт идэвхтэй" },
  { bit: 5, name: "Хүйтэн салхинаас хамгаалалт" },
  { bit: 6, name: "Сэнсний алдаа" },
];

/* Bit2,3,4,5 нь алдаа биш, горим/статус заагч тул анхаар */
const WARNING_BITS = new Set([2, 3, 4, 5]);

const MODE_MAP = {
  0: { label: "Хэрэглэлт", icon: "❄" },
  1: { label: "Халаалт",   icon: "🔥" },
  2: { label: "Агааржуулалт", icon: "💨" },
};

function entityVal(hass, entityId) {
  const s = hass.states[entityId];
  if (!s) return null;
  const v = parseFloat(s.state);
  return isNaN(v) ? null : v;
}

function buildSlaveEntities(slaveId) {
  const p = `sensor.fcu_${slaveId}`;
  return {
    power:       `${p}_power`,
    mode:        `${p}_mode`,
    fanGear:     `${p}_fan_gear`,
    fanMode:     `${p}_fan_mode`,
    setTemp:     `${p}_set_temp`,
    ambientTemp: `${p}_ambient_temp`,
    pipeTemp:    `${p}_pipe_temp`,
    rpm:         `${p}_rpm`,
    alarms:      `${p}_alarms`,
    currentGear: `${p}_current_gear`,
  };
}

class FcuDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
  }

  setConfig(config) {
    if (!config.slaves || !Array.isArray(config.slaves)) {
      throw new Error("'slaves' жагсаалт шаардлагатай. Жишээ:\nslaves:\n  - id: 2\n    name: FCU 1");
    }
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (!this._config || !this._hass) return;

    const slaves = this._config.slaves || [];
    const title  = this._config.title || "FCU Хяналтын самбар";
    const hass   = this._hass;

    /* Статус тооцоо */
    let cntOn = 0, cntOff = 0, cntErr = 0;
    const fcuData = slaves.map(slave => {
      const ids = buildSlaveEntities(slave.id);
      const power       = entityVal(hass, ids.power);
      const mode        = entityVal(hass, ids.mode)        ?? 0;
      const fanGear     = entityVal(hass, ids.fanGear)     ?? 1;
      const fanMode     = entityVal(hass, ids.fanMode)     ?? 0;
      const setTemp     = entityVal(hass, ids.setTemp);
      const ambientTemp = entityVal(hass, ids.ambientTemp);
      const alarmVal    = entityVal(hass, ids.alarms)      ?? 0;
      const currentGear = entityVal(hass, ids.currentGear) ?? fanGear;

      const isAvailable = power !== null;
      const isOn  = power === 1;

      /* Алдааны битүүд задлах */
      const alarmBits = ALARM_BITS.map(a => {
        const triggered = !!(alarmVal & (1 << a.bit));
        const isWarn = WARNING_BITS.has(a.bit);
        let st = "ok";
        if (triggered) st = isWarn ? "warn" : "err";
        return { name: a.name, st };
      });

      const hasError = alarmBits.some(a => a.st === "err");
      const hasWarn  = alarmBits.some(a => a.st === "warn");

      let statusClass = "off";
      if (!isAvailable) { cntOff++; statusClass = "off"; }
      else if (!isOn)   { cntOff++; statusClass = "off"; }
      else if (hasError){ cntErr++; statusClass = "err"; }
      else              { cntOn++;  statusClass = "on";  }

      return {
        name: slave.name || `FCU ${slave.id}`,
        slaveId: slave.id,
        isAvailable,
        isOn,
        statusClass,
        mode,
        fanGear: currentGear,
        fanMode,
        setTemp,
        ambientTemp,
        alarmBits,
        hasError,
        hasWarn,
      };
    });

    /* HTML байгуулах */
    const root = this.shadowRoot;
    root.innerHTML = `<style>${STYLES}</style>`;

    const wrap = document.createElement("ha-card");
    wrap.innerHTML = `
      <div class="card-root">
        <div class="card-title">${title}</div>
        <div class="summary-bar">
          <div class="summary-item">
            <div class="summary-num num-on">${cntOn}</div>
            <div class="summary-label">Ажиллаж байгаа</div>
          </div>
          <div class="summary-item">
            <div class="summary-num num-off">${cntOff}</div>
            <div class="summary-label">Унтраалттай</div>
          </div>
          <div class="summary-item">
            <div class="summary-num num-err">${cntErr}</div>
            <div class="summary-label">Алдаатай</div>
          </div>
        </div>
        <div class="fcu-grid">
          ${fcuData.map(f => this._renderFcu(f)).join("")}
        </div>
      </div>
    `;
    root.appendChild(wrap);
  }

  _renderFcu(f) {
    if (!f.isAvailable) {
      return `
        <div class="fcu-card">
          <div class="fcu-header">
            <div>
              <div class="fcu-name">${f.name}</div>
              <div class="fcu-slave">slave ${f.slaveId}</div>
            </div>
            <span class="badge badge-off">Холбогдоогүй</span>
          </div>
          <div class="unavailable">Entity олдсонгүй<br><small>sensor.fcu_${f.slaveId}_power</small></div>
        </div>`;
    }

    const modeInfo = MODE_MAP[f.mode] || MODE_MAP[0];
    const badgeCls = f.statusClass === "on" ? "badge-on"
                   : f.statusClass === "err" ? "badge-err" : "badge-off";
    const badgeLabel = f.statusClass === "on" ? "Асаалттай"
                     : f.statusClass === "err" ? "Алдаатай" : "Унтраалттай";
    const cardCls = f.hasError ? "fcu-card status-err" : "fcu-card";

    /* Сэнсний хурдны цэгүүд (5 хүртэл) */
    const dots = [1,2,3,4,5].map(i =>
      `<div class="dot ${f.fanGear >= i ? "active" : ""}"></div>`
    ).join("");

    const ambStr = f.ambientTemp !== null ? `${f.ambientTemp}°C` : "--";
    const setStr = f.setTemp     !== null ? `${f.setTemp}°C`     : "--";
    const fanModeLabel = f.fanMode === 1 ? "Auto" : "Manual";

    /* Алдааны мөрүүд */
    const alarmRows = f.alarmBits.map(a => `
      <div class="alarm-row">
        <span class="alarm-name">${a.name}</span>
        <span class="alarm-status ${a.st === "ok" ? "st-ok" : a.st === "warn" ? "st-warn" : "st-err"}">
          <span class="st-dot dot-${a.st}"></span>
          ${a.st === "ok" ? "OK" : a.st === "warn" ? "АНХААРУУЛГА" : "АЛДАА"}
        </span>
      </div>`).join("");

    return `
      <div class="${cardCls}">
        <div class="fcu-header">
          <div>
            <div class="fcu-name">${f.name}</div>
            <div class="fcu-slave">slave ${f.slaveId}</div>
          </div>
          <span class="badge ${badgeCls}">${badgeLabel}</span>
        </div>

        <div class="info-row">
          <span class="info-label">Горим</span>
          <span class="info-val">
            <span class="mode-icon">${modeInfo.icon}</span>${modeInfo.label}
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Орчны темп</span>
          <span class="info-val">${ambStr}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Тохируулга</span>
          <span class="info-val">${setStr}</span>
        </div>
        <div class="fan-row">
          <span class="info-label">Сэнсний хурд</span>
          <div style="display:flex;align-items:center">
            <div class="dots">${dots}</div>
            <span class="fan-mode-label">${fanModeLabel}</span>
          </div>
        </div>

        <hr class="divider">
        <div class="alarm-title">Алдааны мэдээлэл (Register 24)</div>
        ${alarmRows}
      </div>`;
  }

  getCardSize() { return 6; }

  static getConfigElement() {
    return document.createElement("fcu-dashboard-card-editor");
  }

  static getStubConfig() {
    return {
      title: "FCU Хяналтын самбар",
      slaves: [
        { id: 2, name: "FCU 1" },
        { id: 3, name: "FCU 2" },
        { id: 4, name: "FCU 3" },
        { id: 5, name: "FCU 4" },
        { id: 6, name: "FCU 5" },
        { id: 7, name: "FCU 6" },
      ],
    };
  }
}

customElements.define("fcu-dashboard-card", FcuDashboardCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type:        "fcu-dashboard-card",
  name:        "FCU Dashboard Card",
  description: "RS485 Modbus Fan Coil Unit хяналтын самбар (slave 2-7)",
  preview:     true,
  documentationURL: "https://github.com/ТААНЫ/fcu-dashboard-card",
});

console.info(
  "%c FCU-DASHBOARD-CARD %c v1.0.0 ",
  "color:#fff;background:#378ADD;font-weight:bold;padding:2px 4px;border-radius:4px 0 0 4px",
  "color:#378ADD;background:#EAF3DE;font-weight:bold;padding:2px 4px;border-radius:0 4px 4px 0"
);
