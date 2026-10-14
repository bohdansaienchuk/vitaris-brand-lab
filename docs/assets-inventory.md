# Інвентаризація графічних ресурсів

Дата аудиту: 2026-10-14.

Охоплення: `shared/assets/` і `brands/*/assets/`. Перевірено SVG, PNG, JPG/JPEG, WebP і PDF. Фактично знайдено 17 файлів: 1 SVG, 14 PNG і 2 JPG. WebP та PDF відсутні.

Усі статуси залишено `needs-review`. Технічна придатність не означає візуального або брендового затвердження.

## Загальний каталог

| ID | Product | File | Type | Dimensions | Size | Status |
|---|---|---|---|---:|---:|---|
| `vitaris-corporate-logo-001` | Shared | `shared/assets/logos/originals/Vitaris logo_сurv.png` | corporate-logo | 533×177 | 9.6 KiB | needs-review |
| `vitaris-corporate-logo-002` | Shared | `shared/assets/logos/originals/Vitaris logo_сurv.svg` | corporate-logo | viewBox 255.48×84.54 | 6.5 KiB | needs-review |
| `vitaris-corporate-logo-003` | Shared | `shared/assets/logos/originals/viber-logo-1024*512-02.png` | corporate-logo | 4267×2134 | 111.7 KiB | needs-review |
| `evomax-packaging-001` | evomax-balance | `assets/packaging/2-Evomax_1-1.png` | product-mockup | 4000×3008 | 1.70 MiB | needs-review |
| `evomax-packaging-002` | evomax-balance | `assets/packaging/2-Evomax_2-1.png` | product-mockup | 4000×3008 | 768.8 KiB | needs-review |
| `evomax-packaging-003` | evomax-balance | `assets/packaging/2-Evomax_3.png` | product-mockup | 3840×1953 | 838.4 KiB | needs-review |
| `evomax-packaging-004` | evomax-balance | `assets/packaging/2-Evomax_4-1.png` | product-mockup | 4000×3008 | 1.71 MiB | needs-review |
| `evomax-packaging-005` | evomax-balance | `assets/packaging/2-Evomax_5-1.png` | product-mockup | 4000×3008 | 2.18 MiB | needs-review |
| `evomax-packaging-006` | evomax-balance | `assets/packaging/2-Evomax_6-1.png` | product-mockup | 3840×1953 | 1.22 MiB | needs-review |
| `evomax-packaging-007` | evomax-balance | `assets/packaging/2-Evomax_7-1.png` | product-mockup | 3840×1953 | 1.23 MiB | needs-review |
| `evomax-packaging-008` | evomax-balance | `assets/packaging/2-Evomax_13.png` | product-mockup | 3840×1953 | 769.1 KiB | needs-review |
| `evomax-packaging-009` | evomax-balance | `assets/packaging/2-Evomax_14.jpg` | product-mockup | 4000×3008 | 1.00 MiB | needs-review |
| `evomax-packaging-010` | evomax-balance | `assets/packaging/2-Evomax_15.jpg` | product-mockup | 4000×3008 | 1.15 MiB | needs-review |
| `evomax-packaging-011` | evomax-balance | `assets/packaging/2-Evomax_16.png` | product-mockup | 3840×1953 | 1.11 MiB | needs-review |
| `evomax-packaging-012` | evomax-balance | `assets/packaging/2-Evomax_17.png` | product-mockup | 3840×1953 | 1.91 MiB | needs-review |
| `evomax-packaging-013` | evomax-balance | `assets/packaging/2-Evomax_18.png` | product-mockup | 4000×3008 | 2.51 MiB | needs-review |
| `evomax-packaging-014` | evomax-balance | `assets/packaging/Evomax_label.png` | product-mockup | 1122×1402 | 945.0 KiB | needs-review |

Повні MIME types, aspect ratios, color modes, alpha flags, byte sizes та SHA-256 зберігаються у відповідних JSON manifests.

## Corporate Assets

### `vitaris-corporate-logo-001`

PNG, RGBA, прозорість присутня, aspect ratio 3.011299. Роздільна здатність 533×177 достатня для невеликого логотипа, але недостатня для виводу на повну ширину 1080 px без масштабування вгору. Технічний статус: `limited-for-large-display`.

### `vitaris-corporate-logo-002`

Well-formed SVG із `viewBox="0 0 255.48 84.54"`; intrinsic `width` і `height` не задані. Aspect ratio за viewBox — 3.022001. Скриптів, `foreignObject`, event handlers, DOCTYPE/ENTITY, зовнішніх href, data/file/javascript URL або зовнішніх CSS imports не знайдено. Технічний статус: `scalable`.

SVG містить кольори `#1d1d1b` і `#34a936`; аудит не трактує їх як затверджені корпоративні токени.

### `vitaris-corporate-logo-003`

PNG, RGB, без alpha channel, 4267×2134, aspect ratio 1.999531. Має непрозорий білий фон і достатню роздільну здатність. Назва містить неоднозначне слово `viber` і символ `*`, тому потребує ручного уточнення походження та перейменування. Технічний статус: `suitable-with-opaque-background`.

## EvoMax Assets

Усі 14 EvoMax-файлів візуально містять упаковку або композиції упаковок EvoMax Balance, тому класифіковані як `product-mockup`.

- 5 PNG мають 4000×3008 px та alpha channel.
- 6 PNG мають 3840×1953 px та alpha channel.
- 2 JPG мають 4000×3008 px, RGB, без прозорості.
- `Evomax_label.png` має 1122×1402 px, RGB, без прозорості.
- Усі мають достатню кількість пікселів для розміщення як елемент композиції картки 1080×1920 px.
- Переважно горизонтальне співвідношення сторін не робить їх готовими full-canvas backgrounds; їх слід компонувати без деформації та з урахуванням порожнього простору.
- Alpha assets потрібно додатково перевірити на світлому й темному фоні на edge halos, коректність маски та тіней.
- `evomax-packaging-012` потребує особливої візуальної перевірки через низькоконтрастну/напівпрозору композицію.
- Жоден файл не позначено як затверджений для публікації.

## Other Brand Assets

| Product | Found assets | Status |
|---|---:|---|
| magneforce-balance | 0 | missing |
| miomax-complex | 0 | missing |
| zentor-venopulse | 0 | missing |
| betalong-amino-plus | 0 | missing |

Їхні manifests перевірено та залишено з порожніми масивами `assets`.

## Duplicate Files

Повних дублікатів за SHA-256 не виявлено. Візуально подібні EvoMax mockups мають різні контрольні суми та різні композиції або ракурси.

## Quality Issues

- Усі 17 ресурсів мають непідтверджений approval status.
- Raster corporate logo 533×177 обмежений для великого виводу; для масштабування слід розглядати SVG після брендового погодження.
- Wide corporate PNG має непрозорий білий фон.
- Назви всіх 14 EvoMax-файлів не відповідають lower-case kebab-case і недостатньо описують ракурс/варіант.
- Назви `Vitaris logo_сurv.*` містять пробіл, underscore і кириличну літеру `с` у слові `сurv`.
- Назва `viber-logo-1024*512-02.png` містить `*` і неочевидно описує фактичний корпоративний логотип.
- Частина PNG містить великі прозорі поля; це не пошкодження, але впливає на автоматичне позиціонування.
- Візуальна перевірка виконана для raster previews, але фінальна оцінка кольору, edge quality та відповідності brand guidelines потребує відповідального дизайнера/власника бренду.
- Файлів понад 50 MB, пошкоджених файлів і невідповідностей extension/MIME не знайдено.

## Suggested Renames

Перейменування лише рекомендовані й не виконувалися.

| Current filename | Suggested filename |
|---|---|
| `Vitaris logo_сurv.png` | `vitaris-corporate-logo-green-horizontal-01.png` |
| `Vitaris logo_сurv.svg` | `vitaris-corporate-logo-green-horizontal-01.svg` |
| `viber-logo-1024*512-02.png` | `vitaris-corporate-logo-green-horizontal-wide-01.png` |
| `2-Evomax_1-1.png` | `evomax-packaging-box-angle-right-01.png` |
| `2-Evomax_2-1.png` | `evomax-packaging-box-front-01.png` |
| `2-Evomax_3.png` | `evomax-packaging-box-floating-01.png` |
| `2-Evomax_4-1.png` | `evomax-packaging-box-angle-left-01.png` |
| `2-Evomax_5-1.png` | `evomax-packaging-bottles-trio-01.png` |
| `2-Evomax_6-1.png` | `evomax-packaging-bottles-pair-01.png` |
| `2-Evomax_7-1.png` | `evomax-packaging-box-bottle-composite-01.png` |
| `2-Evomax_13.png` | `evomax-packaging-box-angle-left-02.png` |
| `2-Evomax_14.jpg` | `evomax-packaging-boxes-front-back-01.jpg` |
| `2-Evomax_15.jpg` | `evomax-packaging-boxes-trio-01.jpg` |
| `2-Evomax_16.png` | `evomax-packaging-boxes-trio-02.png` |
| `2-Evomax_17.png` | `evomax-packaging-boxes-trio-03.png` |
| `2-Evomax_18.png` | `evomax-packaging-box-bottle-composite-02.png` |
| `Evomax_label.png` | `evomax-packaging-bottle-front-01.png` |

Перед майбутнім перейменуванням потрібно підтвердити семантику кожного ракурсу, створити окремий план migration та одночасно оновити manifests і всі посилання.

## Missing Assets

- Немає жодного продуктного ресурсу для Magneforce Balance, MioMax Complex, Zentor VenoPulse і Betalong Amino Plus.
- Немає окремого затвердженого product-logo EvoMax.
- Немає підтверджених векторних EvoMax packaging/product-logo sources.
- Немає документованих license/source/owner metadata для наявних файлів.
- Немає підтвердженого переліку дозволених варіантів corporate logo.
- У shared icons, illustrations і backgrounds немає ресурсів.

## Recommended Next Steps

1. Підтвердити походження, права використання й approval status усіх 17 файлів.
2. Вибрати затверджений корпоративний logo variant; для великого виводу надати перевагу SVG після перевірки.
3. Підтвердити запропоновані descriptive filenames і виконати перейменування окремим контрольованим завданням.
4. Вибрати один EvoMax mockup для першого HTML/CSS prototype; технічно найпростіші кандидати — portrait `Evomax_label.png` або alpha composition `2-Evomax_18.png`, але вибір потребує брендового погодження.
5. Додати source/rights metadata до manifests після отримання достовірної інформації.
6. Отримати ресурси для інших чотирьох брендів.
7. Перед кожним використанням запускати `npm run validate:assets`.
