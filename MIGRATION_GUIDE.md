# 📋 Инструкция: Выполнение SQL Миграции в Supabase

## Что это такое?
SQL миграция обновляет структуру вашей базы данных, добавляя новые поля и таблицы для поддержки ORT функционала.

---

## 🚀 Пошаговая инструкция

### Шаг 1: Откройте Supabase Dashboard
1. Перейдите на [https://supabase.com](https://supabase.com)
2. Войдите в свой аккаунт
3. Выберите ваш проект **Kerege Synak**

### Шаг 2: Откройте SQL Editor
1. В левом меню найдите раздел **SQL Editor** (иконка `</>`)
2. Нажмите на него

### Шаг 3: Создайте новый запрос
1. Нажмите кнопку **New Query** (Новый запрос)
2. Откроется пустой редактор SQL

### Шаг 4: Скопируйте SQL код
1. Откройте файл `ort_migration.sql` в вашем проекте
2. Скопируйте **весь** код из файла (Ctrl+A, затем Ctrl+C)

### Шаг 5: Вставьте и выполните
1. Вставьте скопированный код в SQL Editor (Ctrl+V)
2. Нажмите кнопку **Run** (Выполнить) или используйте Ctrl+Enter
3. Дождитесь завершения (должно появиться сообщение "Success")

### Шаг 6: Проверка
После выполнения проверьте, что:
- ✅ В таблице `test_results` появились новые колонки: `raw_score`, `scaled_score`, `topic_analysis`
- ✅ Создалась новая таблица `questions`
- ✅ Нет ошибок в консоли

---

## 📝 Что делает миграция?

### 1. Обновляет таблицу `test_results`
```sql
ALTER TABLE test_results 
ADD COLUMN IF NOT EXISTS raw_score INTEGER,
ADD COLUMN IF NOT EXISTS scaled_score INTEGER,
ADD COLUMN IF NOT EXISTS topic_analysis JSONB;
```

**Зачем:**
- `raw_score` - количество правильных ответов
- `scaled_score` - балл по шкале ОРТ (55-245)
- `topic_analysis` - анализ по темам в формате JSON

### 2. Создает таблицу `questions`
```sql
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  correct_answer TEXT NOT NULL,
  weight INTEGER DEFAULT 1,
  topic TEXT,
  section TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Зачем:**
- Хранит метаданные каждого вопроса
- Позволяет задавать вес вопросам
- Группирует вопросы по темам и разделам

### 3. Настраивает Row Level Security (RLS)
```sql
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" 
ON questions FOR SELECT USING (true);
```

**Зачем:**
- Защищает данные
- Разрешает публичное чтение вопросов
- Ограничивает запись только для админов

---

## ⚠️ Возможные проблемы и решения

### Проблема 1: "Permission denied"
**Решение:** Убедитесь, что вы вошли как владелец проекта

### Проблема 2: "Column already exists"
**Решение:** Это нормально! Миграция использует `IF NOT EXISTS`, поэтому безопасно запускать повторно

### Проблема 3: "Table test_results does not exist"
**Решение:** 
1. Сначала создайте базовую структуру
2. Запустите `supabase_schema.sql`
3. Затем запустите `ort_migration.sql`

---

## ✅ Проверка успешности

После миграции выполните этот запрос для проверки:

```sql
-- Проверка структуры test_results
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'test_results';

-- Проверка таблицы questions
SELECT * FROM questions LIMIT 1;
```

Должны увидеть новые колонки в выводе.

---

## 🎯 Что дальше?

После успешной миграции:
1. ✅ Все новые тесты будут сохранять ORT данные
2. ✅ CRM будет показывать расширенную аналитику
3. ✅ Студенты увидят анализ по темам
4. ✅ Админ-панель сможет загружать тесты с темами и весами

---

## 📞 Нужна помощь?

Если возникли проблемы:
1. Проверьте логи в Supabase Dashboard → Logs
2. Убедитесь, что все предыдущие таблицы созданы
3. Попробуйте выполнить миграцию по частям (сначала ALTER TABLE, потом CREATE TABLE)

---

**Время выполнения:** ~30 секунд  
**Сложность:** Легко  
**Риск:** Минимальный (миграция безопасна для существующих данных)
