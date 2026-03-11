// ======================================================
//  KEREGE CERTIFICATE GENERATOR
//  Uses html2canvas + jsPDF (already loaded in index.html)
//  Renders the full A4 portrait template with Kyrgyz Unicode
// ======================================================

(function () {

    /**
     * Analyzes topic_analysis array and categorises topics into
     * Math sections (I бөлүк / II бөлүк) and Kyrgyz sections.
     */
    function parseScoreSections(student) {
        const ta = student.topic_analysis;
        const ort = student.ort_score || student.scaled_score || 0;
        const total = student.total_questions || 150;
        const raw = student.raw_score || student.correct_count || 0;

        // Defaults
        let mathTotal = 60, mathPart1 = 0, mathPart2 = 0;
        let kyrgyzTotal = 90, analogiya = 0, okuup = 0, grammatika = 0;
        let mathScore = 0, kyrgyzScore = 0;

        if (ta && Array.isArray(ta) && ta.length > 0) {
            ta.forEach(t => {
                const name = (t.topic || '').toLowerCase();
                const correct = t.correct || 0;
                const tot = t.total || 0;

                if (name.includes('алгебра') || name.includes('геометр') || name.includes('матем') ||
                    name.includes('i бөлүк') || name.includes('бөлүм 1') || name.includes('часть 1') ||
                    name.includes('math') || name.includes('1-бөлүк')) {
                    mathPart1 += correct;
                    mathScore += correct;
                } else if (name.includes('ii бөлүк') || name.includes('бөлүм 2') || name.includes('часть 2') ||
                    name.includes('2-бөлүк') || name.includes('логика') || name.includes('арифм')) {
                    mathPart2 += correct;
                    mathScore += correct;
                } else if (name.includes('аналог') || name.includes('analogy')) {
                    analogiya += correct;
                    kyrgyzScore += correct;
                } else if (name.includes('окуп') || name.includes('текст') || name.includes('чтен') ||
                    name.includes('comprehension') || name.includes('reading')) {
                    okuup += correct;
                    kyrgyzScore += correct;
                } else if (name.includes('грамм') || name.includes('grammar') || name.includes('синтак') ||
                    name.includes('морфол') || name.includes('лексик')) {
                    grammatika += correct;
                    kyrgyzScore += correct;
                }
            });

            // If nothing matched, split evenly by question count proportions
            if (mathScore === 0 && kyrgyzScore === 0 && raw > 0) {
                mathScore = Math.round(raw * (mathTotal / total));
                kyrgyzScore = raw - mathScore;
                mathPart1 = Math.round(mathScore / 2);
                mathPart2 = mathScore - mathPart1;
                analogiya = Math.round(kyrgyzScore / 3);
                okuup = Math.round(kyrgyzScore / 3);
                grammatika = kyrgyzScore - analogiya - okuup;
            }
        } else if (raw > 0) {
            // No topic_analysis: proportional split
            mathScore = Math.round(raw * (mathTotal / total));
            kyrgyzScore = raw - mathScore;
            mathPart1 = Math.round(mathScore / 2);
            mathPart2 = mathScore - mathPart1;
            analogiya = Math.round(kyrgyzScore / 3);
            okuup = Math.round(kyrgyzScore / 3);
            grammatika = kyrgyzScore - analogiya - okuup;
        }

        return {
            ort,
            mathTotal,
            mathScore,
            mathPart1,
            mathPart2,
            kyrgyzTotal,
            kyrgyzScore,
            analogiya,
            okuup,
            grammatika
        };
    }

    /**
     * Builds analytics text for the two boxes.
     * Returns { good: string[], bad: string[] }
     */
    function parseTopicBoxes(student) {
        const ta = student.topic_analysis;
        const good = [];
        const bad = [];

        if (ta && Array.isArray(ta) && ta.length > 0) {
            ta.forEach(t => {
                const pct = t.percentage || 0;
                if (pct >= 70) {
                    good.push(`${t.topic} — ${pct}% (${t.correct}/${t.total})`);
                } else if (pct < 60) {
                    bad.push(`${t.topic} — ${pct}% (${t.correct}/${t.total})`);
                }
            });
        }

        if (good.length === 0) good.push('Маалымат жок');
        if (bad.length === 0) bad.push('Бардыгы жакшы!');

        return { good, bad };
    }

    /**
     * Renders the SVG curves for top-left corner decoration (red swirl lines).
     */
    function topLeftSvg() {
        return `<svg viewBox="0 0 220 180" xmlns="http://www.w3.org/2000/svg" style="position:absolute;top:0;left:0;width:220px;height:180px;">
            <path d="M0,0 Q60,20 40,80 Q20,140 80,160" stroke="#8B0000" stroke-width="1.2" fill="none" opacity="0.6"/>
            <path d="M10,0 Q70,25 50,85 Q30,145 90,162" stroke="#B22222" stroke-width="1.0" fill="none" opacity="0.5"/>
            <path d="M20,0 Q80,30 60,90 Q40,150 100,165" stroke="#CC2200" stroke-width="0.8" fill="none" opacity="0.4"/>
            <path d="M30,0 Q90,35 70,95 Q50,155 110,168" stroke="#A00000" stroke-width="0.7" fill="none" opacity="0.35"/>
            <path d="M40,0 Q100,40 80,100 Q60,160 120,170" stroke="#8B0000" stroke-width="0.6" fill="none" opacity="0.3"/>
            <path d="M0,10 Q55,35 38,90 Q22,148 82,168" stroke="#CC3300" stroke-width="0.9" fill="none" opacity="0.45"/>
            <path d="M0,20 Q50,40 35,95 Q20,150 78,170" stroke="#AA1100" stroke-width="0.7" fill="none" opacity="0.35"/>
            <path d="M50,0 Q110,45 90,105 Q70,165 130,175" stroke="#B00000" stroke-width="0.5" fill="none" opacity="0.25"/>
            <!-- Gold accent curve -->
            <path d="M0,5 Q80,10 120,5 Q160,0 200,20 Q220,30 220,40" stroke="#C8960C" stroke-width="2.5" fill="none" opacity="0.9"/>
            <path d="M0,2 Q80,8 125,2 Q165,-2 205,18 Q222,28 222,38" stroke="#F0C040" stroke-width="1.2" fill="none" opacity="0.7"/>
        </svg>`;
    }

    /**
     * Bottom-right corner decoration SVG.
     */
    function bottomRightSvg() {
        return `<svg viewBox="0 0 220 180" xmlns="http://www.w3.org/2000/svg" style="position:absolute;bottom:0;right:0;width:220px;height:180px;">
            <path d="M220,180 Q160,160 180,100 Q200,40 140,20" stroke="#8B0000" stroke-width="1.2" fill="none" opacity="0.6"/>
            <path d="M210,180 Q150,155 170,95 Q190,35 130,18" stroke="#B22222" stroke-width="1.0" fill="none" opacity="0.5"/>
            <path d="M200,180 Q140,150 160,90 Q180,30 120,15" stroke="#CC2200" stroke-width="0.8" fill="none" opacity="0.4"/>
            <path d="M190,180 Q130,145 150,85 Q170,25 110,12" stroke="#A00000" stroke-width="0.7" fill="none" opacity="0.35"/>
            <path d="M180,180 Q120,140 140,80 Q160,20 100,10" stroke="#8B0000" stroke-width="0.6" fill="none" opacity="0.3"/>
            <path d="M220,170 Q165,145 182,85 Q198,32 138,12" stroke="#CC3300" stroke-width="0.9" fill="none" opacity="0.45"/>
            <path d="M220,160 Q170,140 185,78 Q195,28 140,10" stroke="#AA1100" stroke-width="0.7" fill="none" opacity="0.35"/>
            <!-- Gold accent curve -->
            <path d="M220,175 Q140,170 100,175 Q60,180 20,160 Q0,150 0,140" stroke="#C8960C" stroke-width="2.5" fill="none" opacity="0.9"/>
            <path d="M220,178 Q140,172 98,178 Q58,183 18,162 Q-2,152 -2,142" stroke="#F0C040" stroke-width="1.2" fill="none" opacity="0.7"/>
        </svg>`;
    }

    /**
     * Gold medallion badge SVG (center top).
     */
    function medallionSvg() {
        return `<svg viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg" style="width:90px;height:90px;">
            <!-- Outer gold ring with spikes -->
            <circle cx="55" cy="55" r="50" fill="url(#goldGrad)" stroke="#A07000" stroke-width="1"/>
            <!-- Spike ring -->
            <g fill="#C8960C">
                ${Array.from({length: 24}, (_, i) => {
                    const angle = (i / 24) * Math.PI * 2;
                    const r1 = 48, r2 = 54;
                    const x1 = 55 + r1 * Math.cos(angle), y1 = 55 + r1 * Math.sin(angle);
                    const x2 = 55 + r2 * Math.cos(angle + Math.PI/24), y2 = 55 + r2 * Math.sin(angle + Math.PI/24);
                    const x3 = 55 + r1 * Math.cos(angle + Math.PI/12), y3 = 55 + r1 * Math.sin(angle + Math.PI/12);
                    return `<polygon points="${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)}"/>`;
                }).join('')}
            </g>
            <!-- Inner circle with dark red background -->
            <circle cx="55" cy="55" r="38" fill="#8B0000"/>
            <circle cx="55" cy="55" r="34" fill="#6B0000"/>
            <!-- Kerege pattern (simplified cross-hatch) - white lines inside -->
            <g stroke="rgba(255,255,255,0.35)" stroke-width="0.8" fill="none">
                <line x1="35" y1="40" x2="75" y2="70"/><line x1="35" y1="50" x2="75" y2="80"/>
                <line x1="35" y1="60" x2="75" y2="90"/><line x1="35" y1="30" x2="75" y2="60"/>
                <line x1="75" y1="40" x2="35" y2="70"/><line x1="75" y1="50" x2="35" y2="80"/>
                <line x1="75" y1="60" x2="35" y2="90"/><line x1="75" y1="30" x2="35" y2="60"/>
            </g>
            <!-- КЕРЕГЕ text -->
            <text x="55" y="51" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#FFD700" letter-spacing="1">КЕРЕГЕ</text>
            <text x="55" y="63" text-anchor="middle" font-family="Arial, sans-serif" font-size="6" fill="#FFC0C0">✦ ✦ ✦</text>
            <defs>
                <radialGradient id="goldGrad" cx="40%" cy="35%" r="65%">
                    <stop offset="0%" stop-color="#FFE066"/>
                    <stop offset="40%" stop-color="#C8960C"/>
                    <stop offset="100%" stop-color="#8B6000"/>
                </radialGradient>
            </defs>
        </svg>`;
    }

    /**
     * Builds the full certificate HTML element (off-screen).
     * A4 size at 96dpi → 794 × 1123px
     */
    function buildCertificateElement(student) {
        const scores = parseScoreSections(student);
        const boxes = parseTopicBoxes(student);

        const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || '—';
        const region = student.region || '—';
        const oblast = student.oblast || '—';
        const classLabel = oblast !== '—' ? oblast : '—';
        // Use row number/id as Номер
        const numLabel = student.id ? String(student.id).substring(0, 8) : '—';
        const parentName = student.parent_name || '—';
        const parentPhone = student.parent_phone || '—';
        const dateStr = student.created_at
            ? new Date(student.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
            : new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

        const photoHtml = student.photo_url
            ? `<img src="${student.photo_url}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" crossorigin="anonymous"/>`
            : '';

        const goodLines = boxes.good.map(l => `<div style="margin-bottom:5px;font-size:11px;">• ${l}</div>`).join('');
        const badLines  = boxes.bad.map(l  => `<div style="margin-bottom:5px;font-size:11px;">• ${l}</div>`).join('');

        const container = document.createElement('div');
        container.id = '__cert_render__';
        container.style.cssText = `
            position: fixed; left: -9999px; top: 0; z-index: -1;
            width: 794px; height: 1123px;
            background: #fff;
            font-family: 'Segoe UI', 'Noto Sans', Arial, sans-serif;
            overflow: hidden;
            box-sizing: border-box;
        `;

        container.innerHTML = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Playfair+Display:ital,wght@1,700&display=swap');
            #__cert_render__ * { box-sizing: border-box; }
            .cert-label { font-size: 13px; color: #333; font-style: italic; }
            .cert-line { border-bottom: 1px solid #555; display: inline-block; flex: 1; margin-left: 10px; }
            .cert-field-row { display: flex; align-items: flex-end; margin-bottom: 10px; }
            .score-table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
            .score-table td, .score-table th { border: 1px solid #444; padding: 4px 6px; text-align: center; }
            .score-table .red-bg { background: #8B0000; color: white; font-weight: bold; font-style: italic; font-size: 11px; }
        </style>

        <!-- TOP LEFT DECORATION -->
        <div style="position:absolute;top:0;left:0;z-index:1;">${topLeftSvg()}</div>
        <!-- BOTTOM RIGHT DECORATION -->
        <div style="position:absolute;bottom:0;right:0;z-index:1;">${bottomRightSvg()}</div>

        <!-- MEDALLION (top center) -->
        <div style="text-align:center;padding-top:14px;position:relative;z-index:2;">
            ${medallionSvg()}
        </div>

        <!-- MAIN CONTENT AREA -->
        <div style="padding: 0 54px; position:relative; z-index:2;">

            <!-- PERSONAL BLOCK ROW -->
            <div style="display:flex; margin-top:18px; gap:24px; align-items:flex-start;">

                <!-- PHOTO PLACEHOLDER (left) -->
                <div style="
                    width:160px; min-width:160px; height:190px;
                    border: 1.5px solid #888;
                    border-radius: 8px;
                    background: #f5f5f5;
                    overflow:hidden;
                    flex-shrink:0;
                    position:relative;
                ">
                    ${photoHtml}
                </div>

                <!-- FIELDS (right) -->
                <div style="flex:1; padding-top:16px;">
                    <div class="cert-field-row">
                        <span class="cert-label" style="width:90px">Ф.И.О</span>
                        <span class="cert-line" style="min-width:200px;">&nbsp;${fullName}</span>
                    </div>
                    <div class="cert-field-row">
                        <span class="cert-label" style="width:90px">Регион</span>
                        <span class="cert-line">&nbsp;${region}</span>
                    </div>
                    <div class="cert-field-row">
                        <span class="cert-label" style="width:90px">Класс</span>
                        <span class="cert-line">&nbsp;${classLabel}</span>
                    </div>
                    <div class="cert-field-row">
                        <span class="cert-label" style="width:90px">Номер</span>
                        <span class="cert-line">&nbsp;${numLabel}</span>
                    </div>
                </div>
            </div>

            <!-- PARENT BLOCK -->
            <div style="margin-top:22px;">
                <div class="cert-field-row">
                    <span class="cert-label" style="width:280px; font-size:12px;">Атасынын же апасынын аты-жөнү</span>
                    <span class="cert-line">&nbsp;${parentName}</span>
                </div>
                <div class="cert-field-row">
                    <span class="cert-label" style="width:280px; padding-left:30px;">Телефон номери</span>
                    <span class="cert-line">&nbsp;${parentPhone}</span>
                </div>
            </div>

            <!-- HEADING (italic, dark red, cursive-feel) -->
            <div style="text-align:center; margin-top:22px; margin-bottom:10px; line-height:1.35;">
                <div style="font-family:'Playfair Display', Georgia, serif; font-style:italic; font-size:19px; font-weight:700; color:#8B0000; letter-spacing:0.3px;">
                    Окуучунун "Кереге" окуу борборунан
                </div>
                <div style="font-family:'Playfair Display', Georgia, serif; font-style:italic; font-size:19px; font-weight:700; color:#8B0000; letter-spacing:0.3px;">
                    тапшырган сынамык тестинин жыйынтыгы:
                </div>
            </div>

            <!-- БАЛЛЫ ROW -->
            <div style="display:flex; align-items:flex-end; margin-bottom:14px; gap:10px;">
                <span style="font-size:14px; font-weight:700; font-style:italic;">Баллы:</span>
                <span style="font-size:15px; font-weight:800; color:#8B0000; border-bottom:1.5px solid #555; padding: 0 60px 2px 6px;">&nbsp;${scores.ort}&nbsp;/&nbsp;245</span>
            </div>

            <!-- SCORE TABLE -->
            <table class="score-table">
                <tr>
                    <td rowspan="3" style="font-style:italic; font-weight:600; font-size:11px; text-align:left; padding:5px 7px; width:110px;">1-сынамык тест:</td>
                    <td rowspan="2" style="font-weight:700; width:90px;">Жалпы баллы:</td>
                    <td colspan="5" style="font-size:11px;">Ар бир бөлүмдөн канча суроого туура жооп бериди:</td>
                </tr>
                <tr>
                    <td colspan="2">Математика</td>
                    <td colspan="3">Кыргыз тил</td>
                </tr>
                <tr>
                    <td style="font-size:12px; font-weight:700;">${scores.ort} /</td>
                    <td colspan="2">${scores.mathScore} / ${scores.mathTotal}</td>
                    <td colspan="3">${scores.kyrgyzScore} / ${scores.kyrgyzTotal}</td>
                </tr>
                <tr>
                    <td class="red-bg" rowspan="2">"Кереге" окуу борбору</td>
                    <td></td>
                    <td>I бөлүк</td>
                    <td>II бөлүк</td>
                    <td>Аналогия</td>
                    <td>Окуп түшүнүү</td>
                    <td>Грамматика</td>
                </tr>
                <tr>
                    <td></td>
                    <td>${scores.mathPart1} /</td>
                    <td>${scores.mathPart2} /</td>
                    <td>${scores.analogiya} /</td>
                    <td>${scores.okuup} /</td>
                    <td>${scores.grammatika} /</td>
                </tr>
            </table>

            <!-- ANALYTICS HEADING -->
            <div style="text-align:center; margin-top:18px; margin-bottom:12px;">
                <span style="font-size:13.5px; font-weight:700; color:#8B0000; font-style:italic;">
                    Тестте келген суроолор темалар боюнча:
                </span>
            </div>

            <!-- TWO ANALYTICS BOXES -->
            <div style="display:flex; gap:20px; margin-bottom:18px;">
                <!-- LEFT BOX: Best topics -->
                <div style="
                    flex:1; min-height:155px;
                    background: linear-gradient(160deg, #7a0000 0%, #5c0000 100%);
                    border-radius:10px; padding:12px 14px;
                    color: white; font-size:11.5px;
                    box-shadow: 2px 3px 10px rgba(0,0,0,0.3);
                ">
                    <div style="font-size:11px; font-weight:700; margin-bottom:8px; opacity:0.85; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid rgba(255,255,255,0.25); padding-bottom:5px;">
                        ✅ Мыкты темалар
                    </div>
                    ${goodLines}
                </div>
                <!-- RIGHT BOX: Weak topics -->
                <div style="
                    flex:1; min-height:155px;
                    background: linear-gradient(160deg, #7a0000 0%, #5c0000 100%);
                    border-radius:10px; padding:12px 14px;
                    color: white; font-size:11.5px;
                    box-shadow: 2px 3px 10px rgba(0,0,0,0.3);
                ">
                    <div style="font-size:11px; font-weight:700; margin-bottom:8px; opacity:0.85; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid rgba(255,255,255,0.25); padding-bottom:5px;">
                        ⚠️ Кайталоо керек
                    </div>
                    ${badLines}
                </div>
            </div>

            <!-- FOOTER TEXT -->
            <div style="margin-top:6px;">
                <p style="font-style:italic; font-size:12px; color:#222; margin:0 0 12px 0;">
                    Бул тесттин жыйынтыгы " Кереге" окуу борбору тарабынан берилди.
                </p>
                <div class="cert-field-row">
                    <span style="font-style:italic; font-size:13px; color:#333; width:55px;">Дата</span>
                    <span class="cert-line">&nbsp;${dateStr}</span>
                </div>
            </div>

        </div><!-- /main content -->
        `;

        return container;
    }

    /**
     * Main export: generateCertificate(student)
     * Called from the 📄 PDF button in the CRM table row.
     */
    async function generateCertificate(student) {
        // Guard: libraries must be loaded
        if (!window.html2canvas) {
            alert('html2canvas не загружен. Обновите страницу.');
            return;
        }
        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert('jsPDF не загружен. Обновите страницу.');
            return;
        }

        // Show a non-blocking loader toast
        const toast = document.createElement('div');
        toast.id = '__cert_toast__';
        toast.style.cssText = `
            position:fixed; bottom:30px; right:30px; z-index:99999;
            background:#333; color:#fff; padding:14px 22px; border-radius:10px;
            font-size:14px; font-weight:600; box-shadow:0 4px 20px rgba(0,0,0,0.3);
            transition: opacity 0.3s;
        `;
        toast.textContent = '⏳ Формируется PDF...';
        document.body.appendChild(toast);

        try {
            // Build HTML element
            const el = buildCertificateElement(student);
            document.body.appendChild(el);

            // Wait a tick for fonts/images to apply
            await new Promise(r => setTimeout(r, 350));

            // Render to canvas (scale:2 for high-DPI quality)
            const canvas = await html2canvas(el, {
                scale: 2,
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                width: 794,
                height: 1123,
                logging: false
            });

            // Remove off-screen element
            document.body.removeChild(el);

            // Create jsPDF (A4 portrait, mm units)
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            // A4: 210 × 297 mm
            const imgData = canvas.toDataURL('image/jpeg', 0.97);
            doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);

            const safeName = `${student.first_name || 'Student'}_${student.last_name || 'Certificate'}`
                .replace(/\s+/g, '_').replace(/[^a-zA-ZА-яЁё_\-0-9]/g, '');
            doc.save(`Cert_${safeName}.pdf`);

            // Success toast
            toast.textContent = '✅ PDF скачан!';
            toast.style.background = '#16a34a';
        } catch (err) {
            console.error('Certificate generation error:', err);
            toast.textContent = '❌ Ошибка: ' + err.message;
            toast.style.background = '#dc2626';
        } finally {
            setTimeout(() => {
                const t = document.getElementById('__cert_toast__');
                if (t) t.remove();
            }, 3000);
        }
    }

    // Expose globally — called by onclick in CRM table rows
    window.generateCertificate = generateCertificate;

})();
