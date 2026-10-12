/**
 * Flight Dynamics & G-Force Trajectory Mathematical Engine
 * Analyzes Flydubai FZ1073 Flight Dynamics, Descent/Ascent Kinematics & G-Forces
 * Conceived, designed and directed by Dr G Narenthiran MB ChB BSc(MedSci)(Hons) FEBNS FRCS(SN)
 * g_narenthiran@hotmail.com • © 2026 Dr G Narenthiran. All rights reserved.
 */

(function (window) {
    'use strict';

    const FlightMath = {
        G_ACCEL_FT: 32.174, // Standard gravity in ft/s^2
        G_ACCEL_M: 9.80665, // Standard gravity in m/s^2

        /**
         * Computes the continuous flight trajectory and G-forces
         */
        calculateTrajectory(params = {}) {
            const cruiseAlt = params.cruiseAlt || 34000;          // ft
            const plunge1Drop = params.plunge1Drop || 14125;      // ft
            const plunge1Time = params.plunge1Time || 29;         // s
            const lowestAlt = params.lowestAlt || 16600;          // ft
            const lowestTime = params.lowestTime || 91;           // s
            const pulloutDuration = params.pulloutDuration || 3.0;// s
            const bankAngleDeg = params.bankAngleDeg || 45;       // degrees during turn
            const climbPeakAlt = params.climbPeakAlt || 21725;    // ft
            const climbDuration = params.climbDuration || 45;     // s
            const plunge2Drop = params.plunge2Drop || 6725;       // ft
            const plunge2Duration = params.plunge2Duration || 64; // s
            const finalAlt = params.finalAlt || 15000;            // ft

            const tP1 = plunge1Time;
            const altP1 = cruiseAlt - plunge1Drop; // 19,875 ft
            const tLowest = lowestTime;
            const tPulloutEnd = tLowest + pulloutDuration; // 94s
            const tClimbEnd = tPulloutEnd + climbDuration;  // 139s
            const tPlunge2End = tClimbEnd + plunge2Duration; // 203s
            const totalDuration = tPlunge2End + 20;         // 223s

            // Key knot points representing reported flight profile milestones
            const knots = [
                { t: 0, z: cruiseAlt, bank: 0 },
                { t: 8, z: cruiseAlt - 1600, bank: 0 }, // realistic pushover (~ -0.8g cabin float)
                { t: tP1, z: altP1, bank: 0 }, // 29s: 19,875 ft (~ -40,000 fpm plunge)
                { t: 65, z: altP1 - (altP1 - lowestAlt) * 0.70, bank: 0 }, // transition arc
                { t: tLowest, z: lowestAlt, bank: 15 }, // 91s: 16,600 ft trough
                { t: tPulloutEnd, z: lowestAlt + 350, bank: bankAngleDeg }, // 94s: 3s pullout & 45-deg bank
                { t: tLowest + 18, z: lowestAlt + 2400, bank: bankAngleDeg * 0.3 }, // zoom climb body
                { t: tClimbEnd, z: climbPeakAlt, bank: 0 }, // 139s: 21,725 ft
                { t: tClimbEnd + 30, z: climbPeakAlt - plunge2Drop * 0.55, bank: 0 }, // second dive
                { t: tPlunge2End, z: finalAlt, bank: 0 }, // 203s: 15,000 ft
                { t: totalDuration, z: finalAlt, bank: 0 } // stable level cruise
            ];

            // Monotone cubic Hermite spline interpolation for smooth, realistic aerodynamics
            const n = knots.length;
            const h = [];
            const m = [];
            for (let i = 0; i < n - 1; i++) {
                h.push(knots[i + 1].t - knots[i].t);
                m.push((knots[i + 1].z - knots[i].z) / h[i]);
            }

            const d = new Array(n).fill(0);
            d[0] = 0; // level flight at start
            d[n - 1] = 0; // level flight at end
            for (let i = 1; i < n - 1; i++) {
                if (m[i - 1] * m[i] <= 0) {
                    d[i] = 0;
                } else {
                    d[i] = (m[i - 1] + m[i]) / 2;
                }
            }

            // Zero vertical speed at turning points
            d[4] = 0; // 91s lowest trough
            d[7] = 0; // 139s zoom climb crest

            const dt = 0.5;
            const points = [];

            for (let t = 0; t <= totalDuration; t += dt) {
                let k = 0;
                while (k < n - 2 && knots[k + 1].t < t) k++;

                const t0 = knots[k].t, t1 = knots[k + 1].t;
                const z0 = knots[k].z, z1 = knots[k + 1].z;
                const d0 = d[k], d1 = d[k + 1];
                const b0 = knots[k].bank, b1 = knots[k + 1].bank;

                const u = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
                const u2 = u * u, u3 = u * u * u;
                const h00 = 2 * u3 - 3 * u2 + 1;
                const h10 = u3 - 2 * u2 + u;
                const h01 = -2 * u3 + 3 * u2;
                const h11 = u3 - u2;
                const dtSeg = t1 - t0;

                const z = h00 * z0 + h10 * dtSeg * d0 + h01 * z1 + h11 * dtSeg * d1;
                const bank = b0 + (b1 - b0) * (3 * u2 - 2 * u3);

                points.push({ t, z, bank });
            }

            // Central differencing for velocity & acceleration
            const rawVz = new Array(points.length).fill(0);
            const rawAz = new Array(points.length).fill(0);

            for (let i = 1; i < points.length - 1; i++) {
                rawVz[i] = (points[i + 1].z - points[i - 1].z) / (2 * dt);
                rawAz[i] = (points[i + 1].z - 2 * points[i].z + points[i - 1].z) / (dt * dt);
            }

            // 3-point Gaussian smoothing on acceleration to eliminate numerical discretization spikes
            for (let i = 0; i < points.length; i++) {
                let azSmooth = 0;
                if (i <= 1 || i >= points.length - 2) {
                    azSmooth = rawAz[i];
                } else {
                    azSmooth = 0.25 * rawAz[i - 1] + 0.5 * rawAz[i] + 0.25 * rawAz[i + 1];
                }

                // Normal Load Factor Nz (G-force felt in seat)
                // Nz_level = 1 + az / g
                // Total G in coordinated bank turn: Nz_total = Nz_level / cos(phi)
                const radBank = (points[i].bank * Math.PI) / 180;
                const cosBank = Math.max(0.55, Math.cos(radBank));
                const nzLevel = 1.0 + (azSmooth / this.G_ACCEL_FT);
                const nzTotal = nzLevel / cosBank;

                // Vertical speed in feet per minute
                const vz = rawVz[i];
                const vsiFpm = vz * 60;

                // Flight path pitch angle estimate (approximate)
                const groundSpeedFtSec = 675; // ~400 kts
                const flightPathAngleDeg = (Math.atan2(vz, groundSpeedFtSec) * 180) / Math.PI;

                // Hydrostatic eye-level blood pressure shift
                const deltaEyePressureMmHg = -27.2 * (nzTotal - 1.0);

                points[i].vz = Number(vz.toFixed(1));
                points[i].vsiFpm = Math.round(vsiFpm);
                points[i].az = Number(azSmooth.toFixed(2));
                points[i].nz = Number(Math.max(-0.5, Math.min(5.5, nzTotal)).toFixed(2));
                points[i].pitchDeg = Number(flightPathAngleDeg.toFixed(1));
                points[i].deltaEyePressureMmHg = Math.round(deltaEyePressureMmHg);
            }

            // Summary Key Milestones Analysis
            const nzValues = points.map(p => p.nz);
            const minG = Math.min(...nzValues);
            const maxG = Math.max(...nzValues);
            const maxDescentFpm = Math.min(...points.map(p => p.vsiFpm));
            const maxClimbFpm = Math.max(...points.map(p => p.vsiFpm));

            return {
                points,
                totalDuration,
                minG,
                maxG,
                maxDescentFpm,
                maxClimbFpm,
                milestones: {
                    tCruise: 0,
                    tPlunge1End: tP1,
                    tLowest: tLowest,
                    tPulloutEnd: tPulloutEnd,
                    tClimbPeak: tClimbEnd,
                    tFinalLevel: tPlunge2End
                }
            };
        }
    };

    window.FlightMath = FlightMath;
})(window);
