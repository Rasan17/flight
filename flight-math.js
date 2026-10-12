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

            // Key Timeline Milestones:
            // t = 0: Cruise at cruiseAlt (34,000 ft)
            // t = plunge1Time (29s): Altitude = 34,000 - 14,125 = 19,875 ft
            // t = lowestTime (91s): Altitude = 16,600 ft (lowest point)
            // t = lowestTime + pulloutDuration (94s): Leveled out, sharp turn & climb initiated
            // t = lowestTime + pulloutDuration + climbDuration (139s): Altitude = 21,725 ft (peak)
            // t = 139 + plunge2Duration (203s): Settle at finalAlt (15,000 ft)
            
            const altP1 = cruiseAlt - plunge1Drop;
            const tP1 = plunge1Time;
            const tLowest = lowestTime;
            const tPulloutEnd = tLowest + pulloutDuration;
            const tClimbEnd = tPulloutEnd + climbDuration;
            const tPlunge2End = tClimbEnd + plunge2Duration;
            const totalDuration = tPlunge2End + 20; // add 20s of level flight

            // Generate high-resolution time series (step = 0.5s)
            const dt = 0.5;
            const points = [];

            // We construct a smooth, physically realistic altitude profile z(t) using Hermite/spline blending
            for (let t = 0; t <= totalDuration; t += dt) {
                let z = cruiseAlt;
                let bank = 0;

                if (t <= 0) {
                    z = cruiseAlt;
                } else if (t < tP1) {
                    // Phase 1: Rapid plunge 34,000 to 19,875 ft (29s)
                    // High downward curvature initially (pushover) transitioning into steep dive
                    const u = t / tP1;
                    // S-curve with sharp pushover
                    const s = 1.6 * Math.pow(u, 2) - 0.6 * Math.pow(u, 3);
                    z = cruiseAlt - plunge1Drop * Math.min(1, Math.max(0, s));
                } else if (t < tLowest) {
                    // Phase 2: From 19,875 ft to 16,600 ft (29s to 91s, delta = 62s)
                    // Controls begin resisting, descent decelerates approaching lowest point
                    const u = (t - tP1) / (tLowest - tP1);
                    // Smooth deceleration curve reaching minimum at u = 1
                    const dropRemaining = altP1 - lowestAlt;
                    const smoothDecel = (2 * u - Math.pow(u, 2));
                    z = altP1 - dropRemaining * smoothDecel;
                } else if (t < tPulloutEnd) {
                    // Phase 3A: Immediate 3-second rapid pullout and sharp turn at lowest point
                    // Transitions from horizontal/dive to sharp climb
                    const u = (t - tLowest) / pulloutDuration;
                    // Aircraft levels and pitches sharply up
                    const climbKick = 250 * Math.pow(u, 2); // initiates climb
                    z = lowestAlt + climbKick;
                    bank = bankAngleDeg * Math.sin(u * Math.PI); // sharp bank during turn
                } else if (t < tClimbEnd) {
                    // Phase 3B: Rapid climb from 16,600 ft to 21,725 ft (over 45s)
                    const u = (t - tPulloutEnd) / climbDuration;
                    const climbGain = climbPeakAlt - (lowestAlt + 250);
                    // Fast zoom climb with easing at peak
                    const climbCurve = Math.sin((u * Math.PI) / 2);
                    z = (lowestAlt + 250) + climbGain * climbCurve;
                    if (u < 0.2) {
                        bank = bankAngleDeg * (1 - u / 0.2); // bank rolls out
                    }
                } else if (t < tPlunge2End) {
                    // Phase 4: Second plunge from 21,725 ft down to 15,000 ft (over 64s)
                    const u = (t - tClimbEnd) / plunge2Duration;
                    const s = 3 * Math.pow(u, 2) - 2 * Math.pow(u, 3); // smooth S-curve
                    z = climbPeakAlt - plunge2Drop * s;
                } else {
                    // Stabilized at 15,000 ft
                    z = finalAlt;
                }

                points.push({ t, z, bank });
            }

            // Compute velocities, accelerations, pitch angles and G-forces via central differencing
            for (let i = 0; i < points.length; i++) {
                let vz = 0;
                let az = 0;

                if (i === 0) {
                    vz = (points[1].z - points[0].z) / dt;
                    az = 0;
                } else if (i === points.length - 1) {
                    vz = (points[i].z - points[i - 1].z) / dt;
                    az = 0;
                } else {
                    vz = (points[i + 1].z - points[i - 1].z) / (2 * dt);
                    az = (points[i + 1].z - 2 * points[i].z + points[i - 1].z) / (dt * dt);
                }

                // Normal Load Factor Nz (G-force felt in seat)
                // Nz_level = 1 + az / g
                // With bank angle phi: Nz_total = Nz_level / cos(phi)
                const radBank = (points[i].bank * Math.PI) / 180;
                const cosBank = Math.max(0.2, Math.cos(radBank));
                const nzLevel = 1.0 + (az / this.G_ACCEL_FT);
                const nzTotal = nzLevel / cosBank;

                // Vertical speed in feet per minute
                const vsiFpm = vz * 60;

                // Estimated pitch angle (approximate arctan of flight path angle)
                // Assuming horizontal groundspeed V_h approx 400 kts = 675 ft/s
                const groundSpeedFtSec = 675;
                const flightPathAngleDeg = (Math.atan2(vz, groundSpeedFtSec) * 180) / Math.PI;

                // Hydrostatic eye-level blood pressure difference
                // Normal heart-to-eye height h approx 0.35 m, blood density rho approx 1060 kg/m^3
                // Delta P = - (rho * g * h / 133.32) * (Nz - 1) mmHg approx -27 mmHg per +1G above 1G
                const deltaEyePressureMmHg = -27.2 * (nzTotal - 1.0);

                points[i].vz = Number(vz.toFixed(1));
                points[i].vsiFpm = Math.round(vsiFpm);
                points[i].az = Number(az.toFixed(2));
                points[i].nz = Number(nzTotal.toFixed(2));
                points[i].nzLevel = Number(nzLevel.toFixed(2));
                points[i].pitchDeg = Number(flightPathAngleDeg.toFixed(1));
                points[i].deltaEyePressureMmHg = Math.round(deltaEyePressureMmHg);
            }

            // Summary Key Milestones Analysis
            const nzValues = points.map(p => p.nz);
            const vzValues = points.map(p => p.vz);
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
