/**
 * Flight Dynamics & G-Force Trajectory Analyzer - Main Controller & PFD HUD
 * Handles animations, time scrubbers, charts, cockpit instruments & aeromedical metrics
 * Conceived, designed and directed by Dr G Narenthiran MB ChB BSc(MedSci)(Hons) FEBNS FRCS(SN)
 * g_narenthiran@hotmail.com • © 2026 Dr G Narenthiran. All rights reserved.
 */

(function () {
    'use strict';

    const AppState = {
        theme: 'dark',
        trajectoryData: null,
        currentTime: 0,
        isPlaying: false,
        playSpeed: 1,
        animationFrameId: null,
        charts: {},
        params: {
            cruiseAlt: 34000,
            plunge1Drop: 14125,
            plunge1Time: 29,
            lowestAlt: 16600,
            lowestTime: 91,
            pulloutDuration: 3.0,
            bankAngleDeg: 45,
            climbPeakAlt: 21725,
            climbDuration: 45,
            plunge2Drop: 6725,
            plunge2Duration: 64,
            finalAlt: 15000
        }
    };

    const DOM = {};

    function initDOM() {
        DOM.themeToggle = document.getElementById('theme-toggle');
        DOM.timeSlider = document.getElementById('time-slider');
        DOM.currentTimeVal = document.getElementById('current-time-val');
        DOM.playPauseBtn = document.getElementById('play-pause-btn');
        DOM.speedSelect = document.getElementById('speed-select');
        DOM.resetTimeBtn = document.getElementById('reset-time-btn');

        // PFD Instrument
        DOM.pfdCanvas = document.getElementById('pfd-canvas');
        DOM.gaugeAlt = document.getElementById('gauge-alt');
        DOM.gaugeVsi = document.getElementById('gauge-vsi');
        DOM.gaugeG = document.getElementById('gauge-g');
        DOM.gaugePitch = document.getElementById('gauge-pitch');
        DOM.gaugeEyeP = document.getElementById('gauge-eye-p');

        // Stat boxes
        DOM.statMinG = document.getElementById('stat-min-g');
        DOM.statMaxG = document.getElementById('stat-max-g');
        DOM.statMaxDescent = document.getElementById('stat-max-descent');
        DOM.statMaxClimb = document.getElementById('stat-max-climb');

        // Tuning inputs
        DOM.inputCruiseAlt = document.getElementById('input-cruise-alt');
        DOM.inputP1Drop = document.getElementById('input-p1-drop');
        DOM.inputP1Time = document.getElementById('input-p1-time');
        DOM.inputLowestAlt = document.getElementById('input-lowest-alt');
        DOM.inputLowestTime = document.getElementById('input-lowest-time');
        DOM.inputPulloutDur = document.getElementById('input-pullout-dur');
        DOM.inputBankDeg = document.getElementById('input-bank-deg');
        DOM.inputClimbPeak = document.getElementById('input-climb-peak');
        DOM.inputClimbDur = document.getElementById('input-climb-dur');
        DOM.inputP2Drop = document.getElementById('input-p2-drop');
        DOM.inputP2Dur = document.getElementById('input-p2-dur');
        DOM.inputFinalAlt = document.getElementById('input-final-alt');
        DOM.applyParamsBtn = document.getElementById('apply-params-btn');
        DOM.resetDefaultsBtn = document.getElementById('reset-defaults-btn');
    }

    function setupEventListeners() {
        DOM.themeToggle.addEventListener('click', toggleTheme);

        DOM.timeSlider.addEventListener('input', (e) => {
            AppState.currentTime = parseFloat(e.target.value);
            updateDashboard();
        });

        DOM.playPauseBtn.addEventListener('click', togglePlayPause);

        DOM.speedSelect.addEventListener('change', (e) => {
            AppState.playSpeed = parseFloat(e.target.value);
        });

        DOM.resetTimeBtn.addEventListener('click', () => {
            AppState.currentTime = 0;
            DOM.timeSlider.value = 0;
            updateDashboard();
        });

        DOM.applyParamsBtn.addEventListener('click', readParamsAndRecalculate);
        DOM.resetDefaultsBtn.addEventListener('click', resetDefaults);
    }

    function toggleTheme() {
        AppState.theme = AppState.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', AppState.theme);
        DOM.themeToggle.innerHTML = AppState.theme === 'dark' ? '☀️ Light' : '🌙 Dark';
        renderCharts();
    }

    function togglePlayPause() {
        AppState.isPlaying = !AppState.isPlaying;
        DOM.playPauseBtn.innerHTML = AppState.isPlaying ? '⏸ Pause' : '▶ Play';
        if (AppState.isPlaying) {
            lastFrameTime = performance.now();
            requestAnimationFrame(animationLoop);
        }
    }

    let lastFrameTime = 0;
    function animationLoop(timestamp) {
        if (!AppState.isPlaying) return;

        const deltaSec = (timestamp - lastFrameTime) / 1000;
        lastFrameTime = timestamp;

        AppState.currentTime += deltaSec * AppState.playSpeed;
        const maxT = AppState.trajectoryData.totalDuration;

        if (AppState.currentTime >= maxT) {
            AppState.currentTime = maxT;
            AppState.isPlaying = false;
            DOM.playPauseBtn.innerHTML = '▶ Play';
        }

        DOM.timeSlider.value = AppState.currentTime.toFixed(1);
        updateDashboard();

        if (AppState.isPlaying) {
            requestAnimationFrame(animationLoop);
        }
    }

    function readParamsAndRecalculate() {
        AppState.params.cruiseAlt = parseFloat(DOM.inputCruiseAlt.value) || 34000;
        AppState.params.plunge1Drop = parseFloat(DOM.inputP1Drop.value) || 14125;
        AppState.params.plunge1Time = parseFloat(DOM.inputP1Time.value) || 29;
        AppState.params.lowestAlt = parseFloat(DOM.inputLowestAlt.value) || 16600;
        AppState.params.lowestTime = parseFloat(DOM.inputLowestTime.value) || 91;
        AppState.params.pulloutDuration = parseFloat(DOM.inputPulloutDur.value) || 3.0;
        AppState.params.bankAngleDeg = parseFloat(DOM.inputBankDeg.value) || 45;
        AppState.params.climbPeakAlt = parseFloat(DOM.inputClimbPeak.value) || 21725;
        AppState.params.climbDuration = parseFloat(DOM.inputClimbDur.value) || 45;
        AppState.params.plunge2Drop = parseFloat(DOM.inputP2Drop.value) || 6725;
        AppState.params.plunge2Duration = parseFloat(DOM.inputP2Dur.value) || 64;
        AppState.params.finalAlt = parseFloat(DOM.inputFinalAlt.value) || 15000;

        recalculate();
    }

    function resetDefaults() {
        AppState.params = {
            cruiseAlt: 34000,
            plunge1Drop: 14125,
            plunge1Time: 29,
            lowestAlt: 16600,
            lowestTime: 91,
            pulloutDuration: 3.0,
            bankAngleDeg: 45,
            climbPeakAlt: 21725,
            climbDuration: 45,
            plunge2Drop: 6725,
            plunge2Duration: 64,
            finalAlt: 15000
        };

        DOM.inputCruiseAlt.value = AppState.params.cruiseAlt;
        DOM.inputP1Drop.value = AppState.params.plunge1Drop;
        DOM.inputP1Time.value = AppState.params.plunge1Time;
        DOM.inputLowestAlt.value = AppState.params.lowestAlt;
        DOM.inputLowestTime.value = AppState.params.lowestTime;
        DOM.inputPulloutDur.value = AppState.params.pulloutDuration;
        DOM.inputBankDeg.value = AppState.params.bankAngleDeg;
        DOM.inputClimbPeak.value = AppState.params.climbPeakAlt;
        DOM.inputClimbDur.value = AppState.params.climbDuration;
        DOM.inputP2Drop.value = AppState.params.plunge2Drop;
        DOM.inputP2Dur.value = AppState.params.plunge2Duration;
        DOM.inputFinalAlt.value = AppState.params.finalAlt;

        recalculate();
    }

    function recalculate() {
        AppState.trajectoryData = FlightMath.calculateTrajectory(AppState.params);
        DOM.timeSlider.max = AppState.trajectoryData.totalDuration;

        // Update Stat Cards
        DOM.statMinG.innerHTML = `${AppState.trajectoryData.minG.toFixed(2)} g`;
        DOM.statMaxG.innerHTML = `+${AppState.trajectoryData.maxG.toFixed(2)} g`;
        DOM.statMaxDescent.innerHTML = `${AppState.trajectoryData.maxDescentFpm.toLocaleString()} fpm`;
        DOM.statMaxClimb.innerHTML = `+${AppState.trajectoryData.maxClimbFpm.toLocaleString()} fpm`;

        renderCharts();
        updateDashboard();
    }

    function getCurrentPoint() {
        const points = AppState.trajectoryData.points;
        const t = AppState.currentTime;
        const idx = Math.min(points.length - 1, Math.max(0, Math.round(t / 0.5)));
        return points[idx];
    }

    function updateDashboard() {
        const pt = getCurrentPoint();
        DOM.currentTimeVal.innerHTML = `${pt.t.toFixed(1)} s`;

        // Update Instrument Gauges
        DOM.gaugeAlt.innerHTML = `${Math.round(pt.z).toLocaleString()} ft`;
        DOM.gaugeVsi.innerHTML = `${pt.vsiFpm > 0 ? '+' : ''}${pt.vsiFpm.toLocaleString()} fpm`;
        
        let gColor = 'var(--hud-cyan)';
        if (pt.nz > 2.5) gColor = 'var(--hud-rose)';
        else if (pt.nz < 0.5) gColor = 'var(--hud-blue)';
        DOM.gaugeG.innerHTML = `<span style="color: ${gColor};">${pt.nz > 0 ? '+' : ''}${pt.nz.toFixed(2)} g</span>`;
        
        DOM.gaugePitch.innerHTML = `${pt.pitchDeg > 0 ? '+' : ''}${pt.pitchDeg}&deg;`;
        DOM.gaugeEyeP.innerHTML = `${pt.deltaEyePressureMmHg > 0 ? '+' : ''}${pt.deltaEyePressureMmHg} mmHg`;

        // Draw PFD Artificial Horizon
        drawPFD(pt.pitchDeg, pt.bank, pt.z, pt.vsiFpm, pt.nz);

        // Redraw vertical timepoint indicator across all charts
        ['chart-alt', 'chart-vsi', 'chart-g'].forEach(id => {
            if (AppState.charts[id]) {
                AppState.charts[id].update('none');
            }
        });
    }

    // =========================================================================
    // PRIMARY FLIGHT DISPLAY (PFD) HUD RENDERING
    // =========================================================================
    function drawPFD(pitchDeg, bankDeg, alt, vsi, gForce) {
        const canvas = DOM.pfdCanvas;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);

        ctx.save();
        // Translate to center and rotate by bank angle
        ctx.translate(cx, cy);
        ctx.rotate((-bankDeg * Math.PI) / 180);

        // Pitch shift: 4 pixels per degree
        const pitchShift = pitchDeg * 4;
        ctx.translate(0, pitchShift);

        // Sky & Ground Rectangles
        ctx.fillStyle = '#0284c7'; // Sky Blue
        ctx.fillRect(-w, -h * 2, w * 2, h * 2);

        ctx.fillStyle = '#854d0e'; // Ground Earth
        ctx.fillRect(-w, 0, w * 2, h * 2);

        // Horizon Line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-w, 0);
        ctx.lineTo(w, 0);
        ctx.stroke();

        // Pitch Ladder Bars (+/- 10, 20, 30 deg)
        [-30, -20, -10, 10, 20, 30].forEach(deg => {
            const y = -deg * 4;
            const barW = Math.abs(deg) === 10 ? 40 : 60;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-barW, y);
            ctx.lineTo(barW, y);
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = '10px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(deg.toString(), -barW - 4, y + 3);
            ctx.textAlign = 'left';
            ctx.fillText(deg.toString(), barW + 4, y + 3);
        });

        ctx.restore();

        // Fixed Reticle / Aircraft Symbol in center
        ctx.strokeStyle = '#facc15'; // Amber / Yellow
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        // Left wing
        ctx.moveTo(cx - 50, cy);
        ctx.lineTo(cx - 20, cy);
        ctx.lineTo(cx - 20, cy + 8);
        // Center dot
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        // Right wing
        ctx.moveTo(cx + 20, cy + 8);
        ctx.lineTo(cx + 20, cy);
        ctx.lineTo(cx + 50, cy);
        ctx.stroke();

        // Bank roll pointer at top
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(cx, 10);
        ctx.lineTo(cx - 6, 20);
        ctx.lineTo(cx + 6, 20);
        ctx.closePath();
        ctx.fill();

        // HUD Text Overlay
        ctx.fillStyle = '#10b981';
        ctx.font = '11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`ALT: ${Math.round(alt)} FT`, 10, h - 14);
        ctx.textAlign = 'right';
        ctx.fillText(`VSI: ${vsi} FPM`, w - 10, h - 14);
    }

    // =========================================================================
    // CHART.JS INTEGRATION
    // =========================================================================
    function renderCharts() {
        const pts = AppState.trajectoryData.points;
        const labels = pts.map(p => p.t.toFixed(1));
        const altData = pts.map(p => p.z);
        const vsiData = pts.map(p => p.vsiFpm);
        const gData = pts.map(p => p.nz);

        const isDark = AppState.theme === 'dark';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
        const tickColor = isDark ? '#94a3b8' : '#64748b';

        // 1. Altitude Profile Chart
        renderSingleChart('chart-alt', {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Altitude (ft)',
                    data: altData,
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.08)',
                    fill: true,
                    tension: 0.2,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { grid: { color: gridColor }, ticks: { color: tickColor, maxTicksLimit: 12 }, title: { display: true, text: 'Time (seconds)', color: tickColor } },
                    y: { grid: { color: gridColor }, ticks: { color: tickColor }, title: { display: true, text: 'Altitude (ft)', color: tickColor } }
                },
                plugins: { legend: { display: false } }
            }
        });

        // 2. Vertical Speed Chart (VSI)
        renderSingleChart('chart-vsi', {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Vertical Speed (ft/min)',
                    data: vsiData,
                    borderColor: '#a855f7',
                    backgroundColor: 'rgba(168, 85, 247, 0.08)',
                    fill: true,
                    tension: 0.2,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { grid: { color: gridColor }, ticks: { color: tickColor, maxTicksLimit: 12 } },
                    y: { grid: { color: gridColor }, ticks: { color: tickColor }, title: { display: true, text: 'VSI (ft/min)', color: tickColor } }
                },
                plugins: { legend: { display: false } }
            }
        });

        // 3. G-Force Profile Chart (Load Factor Nz)
        renderSingleChart('chart-g', {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Normal Load Factor (G)',
                        data: gData,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        fill: false,
                        tension: 0.2,
                        pointRadius: 0
                    },
                    {
                        label: '1G Standard Level Flight',
                        data: new Array(pts.length).fill(1.0),
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false
                    },
                    {
                        label: 'Boeing 737 Certified Clean Limit (+2.5G)',
                        data: new Array(pts.length).fill(2.5),
                        borderColor: 'rgba(244, 63, 94, 0.5)',
                        borderDash: [4, 4],
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { grid: { color: gridColor }, ticks: { color: tickColor, maxTicksLimit: 12 }, title: { display: true, text: 'Time (seconds)', color: tickColor } },
                    y: { grid: { color: gridColor }, ticks: { color: tickColor }, title: { display: true, text: 'Load Factor (G)', color: tickColor } }
                },
                plugins: {
                    legend: { labels: { color: isDark ? '#f8fafc' : '#0f172a', font: { size: 11 } } }
                }
            }
        });
    }

    // Custom Chart.js Plugin for Dynamic Vertical Timepoint Indicator
    const verticalLinePlugin = {
        id: 'currentTimeIndicator',
        afterDraw: (chart) => {
            if (AppState.currentTime === undefined || AppState.currentTime === null) return;
            const totalDuration = AppState.trajectoryData?.totalDuration;
            if (!totalDuration) return;

            const ctx = chart.ctx;
            const xAxis = chart.scales.x;
            const yAxis = chart.scales.y;
            if (!xAxis || !yAxis) return;

            // Direct mathematical coordinate mapping: accurate, smooth, and robust across all Chart.js scales
            const progress = Math.max(0, Math.min(1, AppState.currentTime / totalDuration));
            const xPixel = xAxis.left + (xAxis.right - xAxis.left) * progress;

            if (isNaN(xPixel) || xPixel < xAxis.left - 2 || xPixel > xAxis.right + 2) return;

            ctx.save();

            // Subtle vertical highlight beam
            const bandW = 6;
            const grad = ctx.createLinearGradient(0, yAxis.top, 0, yAxis.bottom);
            grad.addColorStop(0, 'rgba(6, 182, 212, 0.28)');
            grad.addColorStop(1, 'rgba(6, 182, 212, 0.04)');
            ctx.fillStyle = grad;
            ctx.fillRect(xPixel - bandW / 2, yAxis.top, bandW, yAxis.bottom - yAxis.top);

            // Glowing vertical hairline indicator
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#06b6d4'; // Bright HUD Cyan
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 8;

            ctx.beginPath();
            ctx.moveTo(xPixel, yAxis.top);
            ctx.lineTo(xPixel, yAxis.bottom);
            ctx.stroke();

            // Diamond / illuminated tracker bead at top
            ctx.setLineDash([]);
            ctx.fillStyle = '#22d3ee';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(xPixel, yAxis.top, 4.5, 0, Math.PI * 2);
            ctx.fill();

            // High-contrast timestamp badge at top
            const timeText = `${AppState.currentTime.toFixed(1)}s`;
            ctx.font = 'bold 11px monospace';
            const textWidth = ctx.measureText(timeText).width;
            const badgeW = textWidth + 12;
            const badgeH = 18;
            const badgeX = Math.max(xAxis.left, Math.min(xAxis.right - badgeW, xPixel - badgeW / 2));
            const badgeY = Math.max(2, yAxis.top - badgeH - 3);

            ctx.shadowBlur = 4;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 1;
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
            } else {
                ctx.rect(badgeX, badgeY, badgeW, badgeH);
            }
            ctx.fill();
            ctx.stroke();

            ctx.shadowBlur = 0;
            ctx.fillStyle = '#38bdf8';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(timeText, badgeX + badgeW / 2, badgeY + badgeH / 2);

            ctx.restore();
        }
    };

    function renderSingleChart(canvasId, config) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (AppState.charts[canvasId]) {
            AppState.charts[canvasId].destroy();
        }
        
        // Attach vertical indicator plugin
        if (!config.plugins) config.plugins = [];
        config.plugins.push(verticalLinePlugin);

        // Interactive click on chart to jump timepoint seamlessly
        if (!canvas._hasScrubClick) {
            canvas.addEventListener('click', (evt) => {
                const chart = AppState.charts[canvasId];
                if (!chart) return;
                const xAxis = chart.scales.x;
                const rect = canvas.getBoundingClientRect();
                const x = evt.clientX - rect.left;
                if (x >= xAxis.left && x <= xAxis.right && AppState.trajectoryData) {
                    const ratio = (x - xAxis.left) / (xAxis.right - xAxis.left);
                    AppState.currentTime = Math.max(0, Math.min(AppState.trajectoryData.totalDuration, ratio * AppState.trajectoryData.totalDuration));
                    DOM.timeSlider.value = AppState.currentTime.toFixed(1);
                    updateDashboard();
                }
            });
            canvas._hasScrubClick = true;
        }

        AppState.charts[canvasId] = new Chart(ctx, config);
    }

    // Initialize application
    document.addEventListener('DOMContentLoaded', () => {
        initDOM();
        setupEventListeners();
        recalculate();
    });

})();
