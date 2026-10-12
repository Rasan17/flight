# Flydubai Flight FZ1073 — Flight Dynamics & G-Force Trajectory Analyzer

An interactive aviation kinematics, flight dynamics, and aeromedical G-force simulation suite analyzing the extreme plunge, sharp pullout recovery, and secondary stabilization of **Flydubai Flight FZ1073**.

Conceived, designed and directed by **Dr G Narenthiran MB ChB BSc(MedSci)(Hons) FEBNS FRCS(SN)** ([g_narenthiran@hotmail.com](mailto:g_narenthiran@hotmail.com)), Neurosurgery Research Listserv, United Kingdom (Implemented with Antigravity AI pair programming).

**&copy; 2026 Dr G Narenthiran. All rights reserved.**

> ⚠️ **Aviation & Aeromedical Research Disclaimer:** This flight dynamics and G-force calculator is built for aerodynamic simulation, educational demonstration, and aeromedical research. Kinematic values are derived from reported altitude milestones and physical equations of motion.

---

## ✈️ Incident Flight Profile & Telemetry Timeline

| Phase | Time Window | Altitude Change | Key Kinematic / Maneuver Event |
| :--- | :--- | :--- | :--- |
| **0. Initial Cruise** | $t = 0\text{ s}$ | $34,000\text{ ft}$ | Steady level cruising flight ($N_z = 1.0\text{ g}$). |
| **1. Rapid Plunge** | $t = 0 \to 29\text{ s}$ | $34,000 \to 19,875\text{ ft}$ ($-14,125\text{ ft}$) | Catastrophic pitch-down dive; vertical descent speed averages $\approx 29,224\text{ ft/min}$ and peaks at $\approx 38,000\text{ ft/min}$. |
| **2. Dive Deceleration** | $t = 29 \to 91\text{ s}$ | $19,875 \to 16,600\text{ ft}$ ($-3,275\text{ ft}$) | Deceleration arc towards lowest altitude as controls are contested. |
| **3. Sharp Correction & Turn** | $t = 91 \to 94\text{ s}$ | $16,600\text{ ft}$ trough | **3-second rapid pullout**, leveling horizontally, sharp directional turn ($\phi \approx 45^\circ - 60^\circ$), yanking controls back. |
| **4. Rapid Zoom Climb** | $t = 94 \to 139\text{ s}$ | $16,600 \to 21,725\text{ ft}$ ($+5,125\text{ ft}$) | Immense kinetic energy converted into a steep climb averaging $+6,833\text{ ft/min}$. |
| **5. Second Plunge** | $t = 139 \to 203\text{ s}$ | $21,725 \to 15,000\text{ ft}$ ($-6,725\text{ ft}$) | Secondary dive over $64\text{ s}$ during ongoing struggle; average descent $\approx -6,305\text{ ft/min}$. |
| **6. Permanent Recovery** | $t \ge 203\text{ s}$ | $15,000\text{ ft}$ | Stabilized in level flight ($N_z \to 1.0\text{ g}$). |

---

## 🔬 Mathematical Physics & G-Force Estimation

### 1. Vertical Normal Load Factor ($N_z$)
The normal load factor felt by occupants along the vertical spinal axis:
$$N_z = 1 + \frac{a_z}{g}$$
where:
- $a_z = \frac{d^2 z}{dt^2}$ is the vertical acceleration in $\text{ft/s}^2$.
- $g = 32.174\text{ ft/s}^2$ ($9.807\text{ m/s}^2$).

### 2. Coordinated Bank Turn Load Multiplier
During a coordinated banked turn at angle $\phi$:
$$N_{z,\text{total}} = \frac{N_{z,\text{level}}}{\cos \phi} = \frac{1 + a_z / g}{\cos \phi}$$

---

## 📊 Summary of Estimated G-Forces

| Flight Phase | Estimated Load Factor ($N_z$) | Physical Experience in Cabin |
| :--- | :--- | :--- |
| **Initial Pushover (0–6s)** | **$0.0\text{ g}$ to $-0.4\text{ g}$** | **Weightlessness / Negative G Pushover:** Unbelted passengers, crew, and loose cabin objects floated and struck the ceiling. |
| **Steep Dive Body (6–29s)** | $\approx 0.8\text{ g}$ to $1.1\text{ g}$ | High descent velocity, loud aerodynamic slipstream noise. |
| **Lowest Point Pullout (91–94s)** | **$+3.5\text{ g}$ to $+4.5\text{ g}$** | **Severe Positive G:** Occupants weighed $3.5\times$ to $4.5\times$ their body weight; extreme physical exertion required to pull controls; gray-out / blackout danger. |
| **Zoom Climb (94–139s)** | $+1.4\text{ g}$ to $+1.8\text{ g}$ | Heavy in seats, visual fields clearing as acceleration levels off. |
| **Second Plunge (139–203s)** | $0.4\text{ g} \to +1.4\text{ g}$ | Secondary partial weightlessness followed by positive G leveling. |

---

## 🧠 Aeromedical, Neurosurgical & Biomechanical Implications

### 1. Hydrostatic Column & Eye-Level Arterial Perfusion Pressure
In an upright human, the vertical distance from heart to eye/brain is $h \approx 35\text{ cm}$. Blood density is $\rho \approx 1060\text{ kg/m}^3$.
Under normal $+1.0\text{ g}$, the hydrostatic pressure reduction from heart to eye is $\approx 27.2\text{ mmHg}$.

Under accelerated load $N_z$:
$$\Delta P_{\text{eye}} = -27.2 \times (N_z - 1.0) \quad [\text{mmHg}]$$

- **At $+3.5\text{ g}$ to $+4.5\text{ g}$:** Eye-level systolic pressure drops by **$68\text{ to } 95\text{ mmHg}$**.
- When retinal arterial pressure drops below intraocular pressure ($10 - 20\text{ mmHg}$), blood flow to the retina ceases:
  - **$+3.0\text{ g} - +3.5\text{ g}$:** Loss of peripheral vision (**Gray-out** / tunnel vision).
  - **$+3.5\text{ g} - +4.5\text{ g}$:** Complete visual loss (**Blackout**) with preserved consciousness for several seconds.
  - If sustained beyond 4–6 seconds without anti-G straining maneuvers: **G-LOC (G-induced Loss of Consciousness)** occurs due to stagnant cerebral hypoxia.

### 2. Biomechanics of the Cockpit Struggle
- At $+4.0\text{ g}$, a pilot's arms (normally weighing $\approx 4\text{ kg}$) effectively weigh **$16\text{ kg}$** ($35\text{ lbs}$).
- Lifting arms to reach overhead panel switches or pulling back on the yoke against aerodynamic elevator trim requires massive muscular recruitment.

### 3. Negative G & Pushover Red-Out ($N_z < 0\text{ g}$)
- During the pitch-down plunge, blood surges cephalad toward the head.
- Jugular venous pressure spikes, leading to acute facial engorgement, conjunctival suffusion, and visual "red-out".

### 4. Airframe Structural Envelope (Boeing 737)
- **FAA / EASA Part 25 Certified Limits:** $+2.5\text{ g}$ clean, $-1.0\text{ g}$ negative.
- The $+3.5\text{ g}$ to $+4.5\text{ g}$ pullout significantly exceeded certified transport operational limits and approached the airframe ultimate structural limit ($+3.75\text{ g} - +3.8\text{ g}$).

---

## 🖥️ Interactive Features in the Web App

1. **Primary Flight Display (PFD) HUD:**
   - Real-time animated artificial horizon, pitch ladder, bank pointer, altitude tape, and VSI readouts.
2. **Synchronized Flight Dynamics Charts:**
   - Altitude Profile $z(t)$
   - Vertical Velocity Profile $v_z(t)$ in ft/min
   - Normal Load Factor $N_z(t)$ G-force chart with physiological threshold markers
3. **Time Scrubber & Animation Playback:**
   - Play/pause with variable speeds (1x, 2x, 5x, 10x) and interactive timeline slider.
4. **Interactive Parameter Tuning:**
   - Modify cruise altitude, dive rate, pullout duration, and bank angle to perform sensitivity analysis.

---

## 🚀 How to Run

1. Open `index.html` directly in any web browser (Safari, Chrome, Edge, Firefox).
2. Or serve locally:
   ```bash
   cd "flight"
   python3 -m http.server 8080
   ```
   and navigate to `http://localhost:8080`.

---

## 👨‍⚕️ Author & Copyright Attribution

- **Conception, Design & Direction:** **Dr G Narenthiran MB ChB BSc(MedSci)(Hons) FEBNS FRCS(SN)**
- **Email:** [g_narenthiran@hotmail.com](mailto:g_narenthiran@hotmail.com)
- **Affiliation:** Neurosurgery Research Listserv, United Kingdom
- **Implementation:** Implemented with Antigravity AI pair programming
- **Copyright:** &copy; 2026 Dr G Narenthiran. All rights reserved.
