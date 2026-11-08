# Как использовать переносимый контракт Mednet Kit

## 1. Статус и состав

Скопируйте **весь каталог**, например в `vendor/design-systems/mednet/` проекта Design Director, либо передайте его архивом/набором файлов. Для потребления не нужны исходный репозиторий, его node_modules, сеть или абсолютные пути машины автора.

Начальная точка — [manifest.json](manifest.json). Версия формата экспорта `1.0.0-draft.1` отделена от версии кита `2.2.1`. Это **source snapshot выпущенного Kit 2.2.1**, привязанный к точному релизному коммиту в `source.revision`. Опубликованные npm tarballs всех четырёх пакетов сверены с исходниками и свежей сборкой: проверены integrity, 190 файлов, экспорты и данные SLSA provenance. Сборка, типы, тесты и целевые браузерные сценарии проверены; результаты и границы — в [verification.md](verification.md). Сам переносимый JSON/Markdown-контракт поставляется этим каталогом отдельно от npm-пакетов. Минимальная версия Design Director/Codex неизвестна: интеграция с их конкретным runtime не тестировалась.

| Файл                               | Назначение                                                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [manifest.json](manifest.json)     | Идентичность, source revision, совместимость, registry provenance, hashes и адреса артефактов              |
| [tokens.json](tokens.json)         | Фактические значения из token sources, aliases, provenance и унаследованные CSS conventions                |
| [components.json](components.json) | Публичные React-модули, части, выбранные props/variants/sizes/defaults, state evidence и usage constraints |
| [design-rules.md](design-rules.md) | Реализация, существующие политики, предложения и известные разрывы, явно разделённые                       |
| [verification.md](verification.md) | Проверки исходников, сборки, экспорта и границы браузерной проверки                                        |
| `schemas/*.schema.json`            | Локальные JSON Schema draft-07 для трёх data artifacts                                                     |

Предложения в четырёх исходных документах были рассмотрены, но не стали установленными стандартами. Их имена и хеши сохранены в `reviewContext`; сами документы не нужны для чтения этого каталога и не объявляются файлами опубликованного коммита.

## 2. Чтение и валидация

1. Прочитайте manifest. Поддерживаемая начальная комбинация: `schemaVersion=1`, `contractVersion=1.0.0-draft.1`; неизвестную несовместимую версию не интерпретировать молча.
2. Разрешайте `artifacts.*.path` относительно папки manifest. Каждый путь должен оставаться внутри переносимого каталога; проверяйте и realpath существующего файла, если возможны symlink/junction.
3. Проверьте SHA-256 **исходных bytes** каждого перечисленного артефакта. Manifest не хеширует сам себя; хеш/подпись всего архива можно фиксировать отдельно у потребителя. Integrity обнаруживает изменение bytes, но сама по себе не подтверждает доверие издателю.
4. Проверьте JSON стандартным draft-07 validator по указанным локальным schemas. `$schema` в данных — локальная ссылка на файл в этой поставке; не загружайте её как remote schema. В JSON Schema standard dialect URL служит идентификатором формата, а не обязательным сетевым запросом.
5. Проверьте `sourceRefs` по `manifest.sources`, `ruleRefs` по `manifest.ruleIndex`, anchors и локальные artifact refs. Repository/dependency source locators — provenance, не обязательные локальные файлы экспортного каталога. Их происхождение проверено при подготовке, но их сетевой доступ для чтения экспорта не требуется.
6. Сравните kit/package versions и declared peer ranges с целевым приложением. Версии peers — условия, объявленные китом, а не список протестированных комбинаций. Если версии расходятся, запросите соответствующий экспорт или сверьте установленный API; не обновляйте зависимости автоматически.

Пример чтения в Node, без специальных SDK:

```js
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, relative, isAbsolute } from 'node:path';

const directory = resolve('vendor/design-systems/mednet');
const manifest = JSON.parse(readFileSync(resolve(directory, 'manifest.json'), 'utf8'));

if (manifest.schemaVersion !== 1 || manifest.contractVersion !== '1.0.0-draft.1') {
  throw new Error('Unsupported Mednet export contract');
}

function readArtifact(name) {
  const artifact = manifest.artifacts[name];
  if (!artifact) throw new Error(`Unknown artifact: ${name}`);
  const file = resolve(directory, artifact.path);
  const child = relative(directory, file);
  if (isAbsolute(child) || child === '..' || child.startsWith('../') || child.startsWith('..\\')) {
    throw new Error('Artifact path escapes the export');
  }
  const bytes = readFileSync(file);
  if (createHash('sha256').update(bytes).digest('hex') !== artifact.sha256) {
    throw new Error(`Artifact integrity mismatch: ${name}`);
  }
  return artifact.mediaType === 'application/json'
    ? JSON.parse(bytes.toString('utf8'))
    : bytes.toString('utf8');
}

const tokens = readArtifact('tokens');
const components = readArtifact('components');
const primary = tokens.values.semantic.primary;
const darkPrimary = tokens.values.semanticDark.primary;
const button = components.modules.find((module) => module.id === 'button');
const buttonPart = button.parts.find((part) => part.name === 'Button');
const sizes = buttonPart.properties.size.values;
```

Пример показывает чтение и проверку bytes/path; JSON Schema validation добавляется валидатором проекта. Для недоверенных файлов также нужна проверка realpath. Код не исполняет содержимое экспорта и не импортирует UI-компоненты.

## 3. Значения, defaults и полнота API

- `tokens.values` сохраняет форму результата штатного token emitter: color, semantic, semanticDark, font, fontWeight, text, radius, shadow, motion. `provenance` указывает JSON Pointer в values и исходный символ/JSON Pointer; значения не подбирались вручную.
- `semanticBindings` сохраняет aliases и происхождение dark overrides; отсутствие override означает light inheritance, а не отсутствие dark token.
- `cssDeclarations` содержит точные declarations штатного emitter: light variables, dark overrides, reduced-motion overrides и Tailwind theme mapping. По ним можно найти имена нецветовых CSS-переменных без исходников. `--color-*: initial` — инструкция сброса namespace Tailwind, а не обычная runtime CSS-переменная.
- `inheritedConventions` — явно отделённые факты installed Tailwind/theme и output emit.ts. Это не новые Mednet tokens. Не переносите их в другую версию Tailwind без сверки.
- `components.modules` — полный module inventory выбранной публичной React surface. Вложенные `parts` включают также hooks/types/helpers с `kind`; это не список только визуальных контролов.
- `parts.properties` — **частичная metadata**. Извлечены собственные finite unions, variants/sizes, локальные defaults и выбранные state/composition props. DOM API, callback signatures, сложные conditional types и весь inherited API не развёрнуты.
- `values=null` означает, что конечное перечисление не установлено; `valuesComplete=false` не разрешает придумать перечисление. `acceptsNull` отдельно описывает допустимость null в извлечённом типе.
- `default.status=known` означает конкретное локальное выражение/литерал, достоверно извлечённый из кода. `unknown` не равен false/closed/первому значению. `expression` сохраняет исходную формулу и не обещает вычисленный default.
- `variantDefinitions` содержит CVA recipes источника. Их классы могут быть исправлены brand.css и зависеть от других props; это не финальный computed style и не разрешение копировать компонент в приложение.
- `observedStateNames` — поисковые имена, выведенные из `stateEvidence`. Эти поля описывают обнаруженные selectors/markers, а не закрытый список возможностей primitive или проверенные keyboard/a11y guarantees. Selector может относиться к предку/потомку, а не только корню части. События и зависимости состояний, не отражённые в этих полях, остаются неизвестными.
- `moduleDirective` фиксирует только наличие `use client` в исходном модуле; отсутствие директивы не сертифицирует любую комбинацию props как server-safe.

Новый типичный size/density prop не создаётся из визуального сходства. В частности, у Input нет собственного `size="sm"`/`density="compact"`. Состояния и inherited API проверяйте по установленным types/API проекта или сообщайте capability gap.

## 4. Разделение существующего и предложенного

Читать `status` обязательно:

- `existing-implementation`: использовать как факт соответствующего source snapshot, учитывая непроверенные состояния и source/dist gap.
- `existing-policy`: соблюдать в её scope; M/S и исключения читать в design-rules. Policy не является доказательством, что код автоматически её обеспечивает.
- `proposed`: возвращать как вариант/решение для владельца, а не как обязательную норму или существующий public API.
- `unknown`: явно сообщать пробел; не дополнять значением из памяти или текущего upstream latest.

Принятие конкретного предложения должно быть зафиксировано владельцем системы и в следующем источнике/экспорте. Простая локальная правка JSON статуса не превращает его в норму всего кита.

## 5. Граница Director и кита

Кит — источник tokens, actual API, implementation constraints и принятого usage knowledge. Director — reasoning о пользователе и задаче, композиция, art direction, visual research и критика. Возвращайте рекомендации со ссылками на module/part, property и rule ID этого manifest. Не храните вторую редактируемую таблицу цветов/высот/variants в Director.

Пример ссылки результата: `moduleId=button`, `partName=Button`, `property=size`, `ruleId=mednet.ui.setup`, вместе с `contractVersion`, `kitVersion` и source revision. Rule IDs проверяются по ruleIndex. Рекомендация должна отдельно указывать rationale, проверку и capability gaps.

Не следует автоматически применять к коду те предложения Director, которые конфликтуют с существующим API, действующими инструкциями проекта или ограничениями бренда. Наличие справки не даёт дополнительных прав записи. Исследовательские references не заменяют установленную версию реализации.

Кит остаётся пригоден без Director: экспорт читается обычными файловыми средствами. Здесь нет обязательного runtime, сетевого сервиса, установленного skill, MCP или kit CLI. Команды agent install/sync/doctor из архитектурного proposal ещё не реализованы.

### Подключение к текущему Design Director

При подготовке дополнительно прочитаны README, project schema и CLI source установленного `@local/codex-design-director` 1.0.0. Проверка ограничена документацией и исходником: runtime-интеграция не запускалась. Точные hashes этих файлов входят в manifest как `consumer-document` provenance, без локальных абсолютных путей.

У этого Director нет отдельной команды импорта kit-контракта. Для обычной задачи агенту явно указывают путь к manifest и design-rules; затем он читает нужные JSON-фрагменты. Существующий поиск references не требует project config и не превращает произвольный kit JSON в curated library record. Не передавайте эти файлы в `store` как аналитическую запись референса.

Для **benchmark context** Director уже принимает `design-director.config.json` с `context_files`, `lock_file` и строкой `ui_kit`. Пример формы по реально прочитанной project schema:

```json
{
  "schema_version": 1,
  "context_files": [
    "vendor/design-systems/mednet/manifest.json",
    "vendor/design-systems/mednet/integration.md",
    "vendor/design-systems/mednet/design-rules.md"
  ],
  "lock_file": "pnpm-lock.yaml",
  "ui_kit": "@mednet/ui@2.1.0",
  "locale": "ru-RU"
}
```

Это образец, не созданная конфигурация другого проекта. Выберите реальный lockfile и фактически установленную версию кита. Для конкретного benchmark добавляйте нужную token/component выборку; не загружайте весь components.json в каждый prompt автоматически. `context_files` — существующий механизм подготовки benchmark, а не подтверждённый native contract adapter. Поле `minimumCompatibleVersion=null` в manifest остаётся честным: документационная совместимость с 1.0.0 не устанавливает минимальную поддерживаемую версию.

## 6. Обновление и совместимость

Ключ кэша: `contractVersion + kit.id + packageVersions + source.revision + artifact SHA-256`. Не используйте только имя Mednet или major версии. Новый экспорт сверяется целиком; не смешивайте tokens одной ревизии с components другой.

Пакетный SemVer и версия формата независимы. Изменение смысла полей/удаление данных контракта требует новой несовместимой версии; уточнение snapshot без изменения формата — новой версии/ревизии экспортного артефакта. Draft не трактуется как стабильный major без отдельного перехода. Для новых readers незнакомые статусы/обязательные capabilities — повод отказаться от интерпретации, а не угадать смысл.

Manifest фиксирует версии package.json и SHA256 sources. Совпадение номера установленного npm-пакета с 2.1.0 ещё не доказывает byte equality с исходниками этого коммита. Для гарантированной реализации нужна сверка конкретной поставки или экспорт из её артефактов. Проверка существования файлов/JSON Schema не заменяет browser/a11y testing.

При обновлении: получить новый полный экспорт от кита, проверить schema/integrity/version, сравнить изменения и заменить согласованный snapshot. Из этого каталога нельзя автоматически обновлять packages, стили, AGENTS.md или публикации.
