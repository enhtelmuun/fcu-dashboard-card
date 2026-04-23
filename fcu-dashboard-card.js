/**
 * FCU Dashboard Card  v1.3.0
 * ═══════════════════════════════════════════════════════════════
 * Dashboard YAML тохиргоо (entity шууд заана):
 *
 *   type: custom:fcu-dashboard-card
 *   title: FCU Хяналтын самбар
 *   fcus:
 *     - entity: climate.fcu_1
 *       name: FCU 1
 *       slave: 2
 *     - entity: climate.fcu_2
 *       name: FCU 2
 *       slave: 3
 *     - entity: climate.fcu_3
 *       name: FCU 3
 *       slave: 4
 *     - entity: climate.fcu_4
 *       name: FCU 4
 *       slave: 5
 *     - entity: climate.fcu_5
 *       name: FCU 5
 *       slave: 6
 *     - entity: climate.fcu_6
 *       name: FCU 6
 *       slave: 7
 *
 * climate entity attributes:
 *   .state                          → off | cool | heat | fan_only
 *   .attributes.current_temperature → addr 20 (орчны темп)
 *   .attributes.temperature         → addr 4  (тохируулга)
 *   .attributes.fan_mode            → fan_low|fan_medium|fan_middle|fan_high
 *   .attributes.friendly_name       → карт дээрх нэр (name тохируулаагүй бол)
 *
 * Нэмэлт sensor (comment нээсний дараа):
 *   fault_entity: sensor.fcu_1_fault_status  → Register 24 alarm bits
 * ═══════════════════════════════════════════════════════════════
 */

const FAN_DOTS = { fan_low: 1, fan_medium: 3, fan_middle: 4, fan_high: 5 };
const FAN_LABEL = { fan_low: "1-р шат", fan_medium: "3-р шат", fan_middle: "4-р шат", fan_high: "5-р шат" };
const HVAC_MODE = {
  cool:     { label: "Хэрэглэлт",    icon: "❄" },
  heat:     { label: "Халаалт",      icon: "🔥" },
  fan_only: { label: "Агааржуулалт", icon: "💨" },
  off:      { label: "Унтраалттай",  icon: ""   },
};
const ALARM_BITS = [
  { bit: 0, name: "Орчны температур сенсор",         type: "err"  },
  { bit: 1, name: "Хоолойн температур сенсор",        type: "err"  },
  { bit: 2, name: "Хавхлагын гаралт",                 type: "warn" },
  { bit: 3, name: "Пассив цэгийн хаалт",              type: "warn" },
  { bit: 4, name: "Хөлдөлтөөс хамгаалалт идэвхтэй", type: "warn" },
  { bit: 5, name: "Хүйтэн салхинаас хамгаалалт",     type: "warn" },
  { bit: 6, name: "Сэнсний алдаа",                    type: "err"  },
];

const STYLES = `
:host { display: block; font-family: var(--primary-font-family, sans-serif); }
.root { padding: 14px 16px 18px; }
.card-title { font-size: 15px; font-weight: 500; color: var(--primary-text-color); margin-bottom: 12px; }
.summary { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-bottom: 14px; }
.s-box { background: var(--secondary-background-color); border-radius: 10px; padding: 10px 6px; text-align: center; }
.s-num { font-size: 28px; font-weight: 500; line-height: 1.1; }
.s-lbl { font-size: 11px; color: var(--secondary-text-color); margin-top: 2px; }
.c-on  { color: var(--success-color, #3B6D11); }
.c-off { color: var(--secondary-text-color); }
.c-err { color: var(--error-color, #A32D2D); }
.grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; }
@media (max-width: 480px) { .grid { grid-template-columns: 1fr; } }
.fcu { background: var(--card-background-color,#fff); border: 0.5px solid var(--divider-color); border-radius: 12px; padding: 12px 13px 10px; }
.fcu.err-border { border: 1.5px solid var(--error-color, #E24B4A); }
.hdr { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 9px; }
.fcu-name { font-size: 13px; font-weight: 500; color: var(--primary-text-color); }
.fcu-sub { font-size: 10px; color: var(--secondary-text-color); margin-top: 1px; }
.badge { font-size: 10px; font-weight: 500; padding: 2px 8px; border-radius: 99px; white-space: nowrap; }
.b-on  { background: #EAF3DE; color: #3B6D11; }
.b-off { background: var(--secondary-background-color); color: var(--secondary-text-color); }
.b-err { background: #FCEBEB; color: #A32D2D; }
.row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; margin-bottom: 4px; }
.lbl { color: var(--secondary-text-color); }
.val { font-size: 13px; font-weight: 500; color: var(--primary-text-color); display:flex; align-items:center; gap:3px; }
.fan-wrap { display: flex; align-items: center; gap: 5px; }
.dots { display: flex; gap: 3px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--divider-color); }
.dot.on { background: #378ADD; }
.fan-lbl { font-size: 10px; color: var(--secondary-text-color); }
.div { border: none; border-top: 0.5px solid var(--divider-color); margin: 8px 0; }
.alarm-ttl { font-size: 10px; color: var(--secondary-text-color); margin-bottom: 5px; }
.alarm-row { display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-bottom: 3px; }
.a-name { color: var(--secondary-text-color); flex: 1; margin-right: 4px; }
.a-st { display: flex; align-items: center; gap: 3px; font-weight: 500; white-space: nowrap; }
.dot-s { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
.dot-ok { background: #639922; } .dot-err { background: #E24B4A; } .dot-warn { background: #EF9F27; }
.t-ok { color: var(--success-color,#3B6D11); } .t-err { color: var(--error-color,#A32D2D); } .t-warn { color: var(--warning-color,#BA7517); }
.unavail { text-align:center; color:var(--secondary-text-color); font-size:11px; padding:14px 0; line-height:1.6; }
`;

class FcuDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass   = null;
  }

  setConfig(config) {
    if (!config.fcus || !Array.isArray(config.fcus)) {
      throw new Error(
        "'fcus' жагсаалт шаардлагатай.\n" +
        "Жишээ:\nfcus:\n  - entity: climate.fcu_1\n    name: FCU 1\n    slave: 2"
      );
    }
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _st(id)      { return this._hass.states[id] || null; }
  _state(id)   { const s = this._st(id); return s ? s.state : null; }
  _attr(id, k) { const s = this._st(id); return s ? (s.attributes[k] ?? null) : null; }
  _num(id)     { const v = parseFloat(this._state(id)); return isNaN(v) ? null : v; }

  _build(fcu) {
    const cid      = fcu.entity;                               // climate.fcu_1 гэх мэт
    const hvacMode = this._state(cid);
    const ambTemp  = this._attr(cid, "current_temperature");
    const setTemp  = this._attr(cid, "temperature");
    const fanMode  = this._attr(cid, "fan_mode");
    const friendly = this._attr(cid, "friendly_name");

    /* fault_entity тохируулсан бол ашиглана, эс бөгөөс алгасна */
    const faultId  = fcu.fault_entity || null;
    const faultRaw = faultId ? this._num(faultId) : null;

    const isAvail = hvacMode !== null;
    const isOn    = isAvail && hvacMode !== "off" && hvacMode !== "unavailable";
    const fanDots = FAN_DOTS[fanMode] ?? 0;

    const raw    = faultRaw ?? 0;
    const alarms = ALARM_BITS.map(a => ({
      name: a.name,
      st:   (faultRaw !== null && (raw & (1 << a.bit))) ? a.type : "ok",
    }));
    const hasErr = faultRaw !== null && alarms.some(a => a.st === "err");

    let status = "off";
    if (isAvail && isOn && hasErr) status = "err";
    else if (isAvail && isOn)      status = "on";

    return {
      entity:   cid,
      name:     fcu.name || friendly || cid,
      slave:    fcu.slave ? `slave ${fcu.slave}` : cid,
      isAvail, isOn, status,
      hvacMode, ambTemp, setTemp,
      fanMode, fanDots,
      alarms, hasErr,
      hasFault: faultRaw !== null,
    };
  }

  _cardHtml(f) {
    if (!f.isAvail) {
      return `
        <div class="fcu">
          <div class="hdr">
            <div>
              <div class="fcu-name">${f.name}</div>
              <div class="fcu-sub">${f.entity}</div>
            </div>
            <span class="badge b-off">Холбогдоогүй</span>
          </div>
          <div class="unavail">
            <strong>${f.entity}</strong> олдсонгүй<br>
            <small>HA-г restart хийнэ үү</small>
          </div>
        </div>`;
    }

    const mi   = HVAC_MODE[f.hvacMode] ?? { label: f.hvacMode, icon: "" };
    const bCls = f.status === "on" ? "b-on" : f.status === "err" ? "b-err" : "b-off";
    const bTxt = f.status === "on" ? "Асаалттай" : f.status === "err" ? "Алдаатай" : "Унтраалттай";
    const cls  = `fcu${f.hasErr ? " err-border" : ""}`;
    const dots = [1,2,3,4,5].map(i =>
      `<div class="dot${f.fanDots >= i ? " on" : ""}"></div>`
    ).join("");
    const fanLbl = FAN_LABEL[f.fanMode] ?? (f.fanMode || "--");

    let alarmSection = "";
    if (f.hasFault) {
      alarmSection = `
        <hr class="div">
        <div class="alarm-ttl">Алдааны мэдээлэл (Register 24)</div>
        ${f.alarms.map(a => `
          <div class="alarm-row">
            <span class="a-name">${a.name}</span>
            <span class="a-st t-${a.st}">
              <span class="dot-s dot-${a.st}"></span>
              ${a.st === "ok" ? "OK" : a.st === "warn" ? "АНХААРУУЛГА" : "АЛДАА"}
            </span>
          </div>`).join("")}`;
    }

    return `
      <div class="${cls}">
        <div class="hdr">
          <div>
            <div class="fcu-name">${f.name}</div>
            <div class="fcu-sub">${f.slave}</div>
          </div>
          <span class="badge ${bCls}">${bTxt}</span>
        </div>
        <div class="row">
          <span class="lbl">Горим</span>
          <span class="val"><span>${mi.icon}</span>${mi.label}</span>
        </div>
        <div class="row">
          <span class="lbl">Орчны темп</span>
          <span class="val">${f.ambTemp ?? "--"}°C</span>
        </div>
        <div class="row">
          <span class="lbl">Тохируулга</span>
          <span class="val">${f.setTemp ?? "--"}°C</span>
        </div>
        <div class="row">
          <span class="lbl">Сэнсний хурд</span>
          <div class="fan-wrap">
            <div class="dots">${dots}</div>
            <span class="fan-lbl">${fanLbl}</span>
          </div>
        </div>
        ${alarmSection}
      </div>`;
  }

  _render() {
    if (!this._config || !this._hass) return;

    const title = this._config.title || "FCU Хяналтын самбар";
    let cntOn = 0, cntOff = 0, cntErr = 0;

    const cards = this._config.fcus.map(f => {
      const d = this._build(f);
      if      (d.status === "on")  cntOn++;
      else if (d.status === "err") cntErr++;
      else                         cntOff++;
      return this._cardHtml(d);
    });

    const root = this.shadowRoot;
    root.innerHTML = `<style>${STYLES}</style>`;
    const haCard = document.createElement("ha-card");
    haCard.innerHTML = `
      <div class="root">
        <div class="card-title">${title}</div>
        <div class="summary">
          <div class="s-box"><div class="s-num c-on">${cntOn}</div><div class="s-lbl">Ажиллаж байгаа</div></div>
          <div class="s-box"><div class="s-num c-off">${cntOff}</div><div class="s-lbl">Унтраалттай</div></div>
          <div class="s-box"><div class="s-num c-err">${cntErr}</div><div class="s-lbl">Алдаатай</div></div>
        </div>
        <div class="grid">${cards.join("")}</div>
      </div>`;
    root.appendChild(haCard);
  }

  getCardSize() { return 7; }

  static getStubConfig() {
    return {
      title: "FCU Хяналтын самбар",
      fcus: [
        { entity: "climate.fcu_1", name: "FCU 1", slave: 2 },
        { entity: "climate.fcu_2", name: "FCU 2", slave: 3 },
        { entity: "climate.fcu_3", name: "FCU 3", slave: 4 },
        { entity: "climate.fcu_4", name: "FCU 4", slave: 5 },
        { entity: "climate.fcu_5", name: "FCU 5", slave: 6 },
        { entity: "climate.fcu_6", name: "FCU 6", slave: 7 },
      ],
    };
  }
}

customElements.define("fcu-dashboard-card", FcuDashboardCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "fcu-dashboard-card",
  name: "FCU Dashboard Card",
  description: "RS485 Modbus FCU хяналтын самбар",
  preview: true,
});
console.info(
  "%c FCU-DASHBOARD-CARD %c v1.3.0 ",
  "color:#fff;background:#378ADD;font-weight:bold;padding:2px 4px;border-radius:4px 0 0 4px",
  "color:#378ADD;background:#EAF3DE;font-weight:bold;padding:2px 4px;border-radius:0 4px 4px 0"
);
