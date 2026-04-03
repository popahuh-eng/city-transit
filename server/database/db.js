const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const initDB = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        name          TEXT    NOT NULL,
        email         TEXT    NOT NULL UNIQUE,
        password      TEXT    NOT NULL,
        role          TEXT    NOT NULL DEFAULT 'user',
        reset_code    TEXT,
        reset_expires BIGINT,
        created_at    TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS routes (
        id           SERIAL PRIMARY KEY,
        number       TEXT    NOT NULL UNIQUE,
        type         TEXT    NOT NULL CHECK(type IN ('bus', 'trolleybus', 'tram')),
        name_ru      TEXT    NOT NULL,
        name_kz      TEXT    NOT NULL,
        name_en      TEXT    NOT NULL,
        from_stop_ru TEXT    NOT NULL,
        from_stop_kz TEXT    NOT NULL,
        from_stop_en TEXT    NOT NULL,
        to_stop_ru   TEXT    NOT NULL,
        to_stop_kz   TEXT    NOT NULL,
        to_stop_en   TEXT    NOT NULL,
        interval_min INTEGER NOT NULL DEFAULT 15,
        is_active    INTEGER NOT NULL DEFAULT 1,
        color        TEXT    NOT NULL DEFAULT '#3b82f6',
        created_at   TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS stops (
        id         SERIAL PRIMARY KEY,
        route_id   INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
        name_ru    TEXT    NOT NULL,
        name_kz    TEXT    NOT NULL,
        name_en    TEXT    NOT NULL,
        order_num  INTEGER NOT NULL,
        lat        REAL,
        lng        REAL
      );

      CREATE TABLE IF NOT EXISTS schedules (
        id         SERIAL PRIMARY KEY,
        route_id   INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
        departure  TEXT    NOT NULL,
        direction  TEXT    NOT NULL CHECK(direction IN ('forward', 'backward')),
        days       TEXT    NOT NULL DEFAULT 'weekday',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS favorites (
        id       SERIAL PRIMARY KEY,
        user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
        UNIQUE(user_id, route_id)
      );
    `);

    const routeCount = await db.query('SELECT COUNT(*) as count FROM routes');
    if (parseInt(routeCount.rows[0].count) > 0) return;

    console.log('🌱 Seeding database...');

    const hashedPassword = bcrypt.hashSync('admin123', 10);
    await db.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING`,
      ['Administrator', 'admin@astana-transit.kz', hashedPassword, 'admin']
    );


  const routes = [
    { number: '1',   type: 'bus',        name_ru: 'Маршрут №1',        name_kz: '№1 бағыты',        name_en: 'Route №1',        from_stop_ru: 'Достык',              from_stop_kz: 'Достық',                  from_stop_en: 'Dostyk',              to_stop_ru: 'ЖД Вокзал',         to_stop_kz: 'Теміржол вокзалы',   to_stop_en: 'Railway Station',   interval_min: 10, color: '#3b82f6' },
    { number: '2',   type: 'bus',        name_ru: 'Маршрут №2',        name_kz: '№2 бағыты',        name_en: 'Route №2',        from_stop_ru: 'Хан Шатыр',           from_stop_kz: 'Хан Шатыр',               from_stop_en: 'Khan Shatyr',         to_stop_ru: 'Мега Силкуэй',      to_stop_kz: 'Мега Силкуэй',       to_stop_en: 'Mega Silkway',      interval_min: 12, color: '#7c3aed' },
    { number: '3',   type: 'bus',        name_ru: 'Маршрут №3',        name_kz: '№3 бағыты',        name_en: 'Route №3',        from_stop_ru: 'Площадь Республики',  from_stop_kz: 'Республика алаңы',        from_stop_en: 'Republic Square',     to_stop_ru: 'Чубары',            to_stop_kz: 'Шұбар',              to_stop_en: 'Chubary',           interval_min: 15, color: '#10b981' },
    { number: '5',   type: 'bus',        name_ru: 'Маршрут №5',        name_kz: '№5 бағыты',        name_en: 'Route №5',        from_stop_ru: 'ЭКСПО',               from_stop_kz: 'EXPO',                    from_stop_en: 'EXPO',                to_stop_ru: 'ЖД Вокзал',         to_stop_kz: 'Теміржол вокзалы',   to_stop_en: 'Railway Station',   interval_min: 18, color: '#f97316' },
    { number: '7',   type: 'bus',        name_ru: 'Маршрут №7',        name_kz: '№7 бағыты',        name_en: 'Route №7',        from_stop_ru: 'Байтерек',            from_stop_kz: 'Бәйтерек',               from_stop_en: 'Baiterek',            to_stop_ru: 'Аэропорт',          to_stop_kz: 'Әуежай',            to_stop_en: 'Airport',           interval_min: 30, color: '#eab308' },
    { number: '10',  type: 'bus',        name_ru: 'Маршрут №10',       name_kz: '№10 бағыты',       name_en: 'Route №10',       from_stop_ru: 'ЖД Вокзал',           from_stop_kz: 'Теміржол вокзалы',        from_stop_en: 'Railway Station',     to_stop_ru: 'ЖК Нурсая',        to_stop_kz: 'Нурсая кешені',      to_stop_en: 'Nursaya Complex',   interval_min: 12, color: '#2563eb' },
    { number: '12',  type: 'bus',        name_ru: 'Маршрут №12',       name_kz: '№12 бағыты',       name_en: 'Route №12',       from_stop_ru: 'Байтерек',            from_stop_kz: 'Бәйтерек',               from_stop_en: 'Baiterek',            to_stop_ru: 'Промышленная зона', to_stop_kz: 'Өнеркәсіп аймағы',  to_stop_en: 'Industrial Zone',   interval_min: 20, color: '#06b6d4' },
    { number: '14',  type: 'bus',        name_ru: 'Маршрут №14',       name_kz: '№14 бағыты',       name_en: 'Route №14',       from_stop_ru: 'Кабанбай батыр',      from_stop_kz: 'Қабанбай батыр',          from_stop_en: 'Kabanbai Batyr',      to_stop_ru: 'ЖК Нурсая',        to_stop_kz: 'Нурсая кешені',      to_stop_en: 'Nursaya Complex',   interval_min: 15, color: '#ec4899' },
    { number: '18',  type: 'bus',        name_ru: 'Маршрут №18',       name_kz: '№18 бағыты',       name_en: 'Route №18',       from_stop_ru: 'Хан Шатыр',           from_stop_kz: 'Хан Шатыр',               from_stop_en: 'Khan Shatyr',         to_stop_ru: 'Квартал А',         to_stop_kz: 'А кварталы',        to_stop_en: 'Quarter A',         interval_min: 15, color: '#8b5cf6' },
    { number: '21',  type: 'bus',        name_ru: 'Маршрут №21',       name_kz: '№21 бағыты',       name_en: 'Route №21',       from_stop_ru: 'Нур-Жол бульвар',     from_stop_kz: 'Нұр-Жол бульвары',       from_stop_en: 'Nur-Zhol Boulevard',  to_stop_ru: 'Чубары',            to_stop_kz: 'Шұбар',              to_stop_en: 'Chubary',           interval_min: 18, color: '#059669' },
    { number: '22',  type: 'bus',        name_ru: 'Маршрут №22',       name_kz: '№22 бағыты',       name_en: 'Route №22',       from_stop_ru: 'ЖД Вокзал',           from_stop_kz: 'Теміржол вокзалы',        from_stop_en: 'Railway Station',     to_stop_ru: 'Байтерек',          to_stop_kz: 'Бәйтерек',          to_stop_en: 'Baiterek',          interval_min: 10, color: '#0ea5e9' },
    { number: '28',  type: 'bus',        name_ru: 'Маршрут №28',       name_kz: '№28 бағыты',       name_en: 'Route №28',       from_stop_ru: 'Сарыарка',            from_stop_kz: 'Сарыарқа',               from_stop_en: 'Saryarka',            to_stop_ru: 'Байтерек',          to_stop_kz: 'Бәйтерек',          to_stop_en: 'Baiterek',          interval_min: 20, color: '#84cc16' },
    { number: '35',  type: 'bus',        name_ru: 'Маршрут №35',       name_kz: '№35 бағыты',       name_en: 'Route №35',       from_stop_ru: 'ЭКСПО',               from_stop_kz: 'EXPO',                    from_stop_en: 'EXPO',                to_stop_ru: 'Жеркент',           to_stop_kz: 'Жеркент',           to_stop_en: 'Zherkent',          interval_min: 25, color: '#f59e0b' },
    { number: '37',  type: 'bus',        name_ru: 'Маршрут №37',       name_kz: '№37 бағыты',       name_en: 'Route №37',       from_stop_ru: 'Туран',               from_stop_kz: 'Тұран даңғылы',           from_stop_en: 'Turan Ave.',          to_stop_ru: 'Сарыарка',          to_stop_kz: 'Сарыарқа',          to_stop_en: 'Saryarka',          interval_min: 15, color: '#f43f5e' },
    { number: '40',  type: 'bus',        name_ru: 'Маршрут №40',       name_kz: '№40 бағыты',       name_en: 'Route №40',       from_stop_ru: 'Нур-Жол бульвар',     from_stop_kz: 'Нұр-Жол бульвары',       from_stop_en: 'Nur-Zhol Boulevard',  to_stop_ru: 'Аэропорт',          to_stop_kz: 'Әуежай',            to_stop_en: 'Airport',           interval_min: 25, color: '#6366f1' },
    { number: '44',  type: 'bus',        name_ru: 'Маршрут №44',       name_kz: '№44 бағыты',       name_en: 'Route №44',       from_stop_ru: 'Алтын Орда',          from_stop_kz: 'Алтын Орда',              from_stop_en: 'Altyn Orda',          to_stop_ru: 'Беговая',           to_stop_kz: 'Беговая',           to_stop_en: 'Begovaya',          interval_min: 20, color: '#14b8a6' },
    { number: '50A', type: 'bus',        name_ru: 'Экспресс №50А',     name_kz: 'Экспресс №50А',    name_en: 'Express №50A',    from_stop_ru: 'ЖД Вокзал',           from_stop_kz: 'Теміржол вокзалы',        from_stop_en: 'Railway Station',     to_stop_ru: 'Аэропорт',          to_stop_kz: 'Әуежай',            to_stop_en: 'Airport',           interval_min: 30, color: '#ef4444' },
    { number: '53',  type: 'bus',        name_ru: 'Маршрут №53',       name_kz: '№53 бағыты',       name_en: 'Route №53',       from_stop_ru: 'Астана-1',            from_stop_kz: 'Астана-1',               from_stop_en: 'Astana-1',            to_stop_ru: 'Гранд Парк',        to_stop_kz: 'Гранд Парк',        to_stop_en: 'Grand Park',        interval_min: 15, color: '#ea580c' },
    { number: 'Т1',  type: 'trolleybus', name_ru: 'Троллейбус №1',     name_kz: 'Троллейбус №1',    name_en: 'Trolleybus №1',   from_stop_ru: 'Площадь Республики',  from_stop_kz: 'Республика алаңы',        from_stop_en: 'Republic Square',     to_stop_ru: 'Сарыарка',          to_stop_kz: 'Сарыарқа',          to_stop_en: 'Saryarka',          interval_min: 10, color: '#2563eb' },
    { number: 'Т2',  type: 'trolleybus', name_ru: 'Троллейбус №2',     name_kz: 'Троллейбус №2',    name_en: 'Trolleybus №2',   from_stop_ru: 'ЖД Вокзал',           from_stop_kz: 'Теміржол вокзалы',        from_stop_en: 'Railway Station',     to_stop_ru: 'Байтерек',          to_stop_kz: 'Бәйтерек',          to_stop_en: 'Baiterek',          interval_min: 12, color: '#a855f7' },
    { number: 'Т3',  type: 'trolleybus', name_ru: 'Троллейбус №3',     name_kz: 'Троллейбус №3',    name_en: 'Trolleybus №3',   from_stop_ru: 'Байтерек',            from_stop_kz: 'Бәйтерек',               from_stop_en: 'Baiterek',            to_stop_ru: 'Нур-Жол бульвар',   to_stop_kz: 'Нұр-Жол бульвары',  to_stop_en: 'Nur-Zhol Blvd',     interval_min:  8, color: '#059669' },
    { number: 'Т4',  type: 'trolleybus', name_ru: 'Троллейбус №4',     name_kz: 'Троллейбус №4',    name_en: 'Trolleybus №4',   from_stop_ru: 'Беговая',             from_stop_kz: 'Беговая',                from_stop_en: 'Begovaya',            to_stop_ru: 'ЦУМ',              to_stop_kz: 'ЦУМ',               to_stop_en: 'Central Dept Store', interval_min: 10, color: '#14b8a6' },
    { number: 'Т5',  type: 'trolleybus', name_ru: 'Троллейбус №5',     name_kz: 'Троллейбус №5',    name_en: 'Trolleybus №5',   from_stop_ru: 'Кабанбай батыр',      from_stop_kz: 'Қабанбай батыр',          from_stop_en: 'Kabanbai Batyr',      to_stop_ru: 'Сарыарка',          to_stop_kz: 'Сарыарқа',          to_stop_en: 'Saryarka',          interval_min: 12, color: '#6366f1' },
    { number: 'С1',  type: 'tram',       name_ru: 'Трамвай С1 (LRT)',  name_kz: 'Трамвай С1 (LRT)', name_en: 'Tram S1 (LRT)',   from_stop_ru: 'ЖД Вокзал',           from_stop_kz: 'Теміржол вокзалы',        from_stop_en: 'Railway Station',     to_stop_ru: 'ЭКСПО',             to_stop_kz: 'EXPO',              to_stop_en: 'EXPO',              interval_min: 20, color: '#dc2626' },
    { number: 'С2',  type: 'tram',       name_ru: 'Трамвай С2 (LRT)',  name_kz: 'Трамвай С2 (LRT)', name_en: 'Tram S2 (LRT)',   from_stop_ru: 'Байтерек',            from_stop_kz: 'Бәйтерек',               from_stop_en: 'Baiterek',            to_stop_ru: 'Аэропорт',          to_stop_kz: 'Әуежай',            to_stop_en: 'Airport',           interval_min: 35, color: '#d97706' },
  ];

  const stopsData = {
    '1':  [
      { ru: 'Достык',              kz: 'Достық',                en: 'Dostyk',              lat: 51.2050, lng: 71.4580 },
      { ru: 'Микрорайон Самал',    kz: 'Самал шағынауданы',     en: 'Samal District',      lat: 51.1980, lng: 71.4530 },
      { ru: 'ЖК Нурсая',          kz: 'Нурсая кешені',         en: 'Nursaya Complex',     lat: 51.1900, lng: 71.4720 },
      { ru: 'Водный центр',        kz: 'Су орталығы',           en: 'Water Center',        lat: 51.1870, lng: 71.4580 },
      { ru: 'Сарыарка',            kz: 'Сарыарқа',              en: 'Saryarka',            lat: 51.1700, lng: 71.4550 },
      { ru: 'Площадь Республики',  kz: 'Республика алаңы',      en: 'Republic Square',     lat: 51.1599, lng: 71.4465 },
      { ru: 'ЖД Вокзал',          kz: 'Теміржол вокзалы',      en: 'Railway Station',     lat: 51.1762, lng: 71.4468 },
    ],
    '2':  [
      { ru: 'Хан Шатыр',          kz: 'Хан Шатыр',             en: 'Khan Shatyr',         lat: 51.1299, lng: 71.4030 },
      { ru: 'Конгресс-холл',       kz: 'Конгресс-холл',         en: 'Congress Hall',       lat: 51.0850, lng: 71.3947 },
      { ru: 'Пирамида',            kz: 'Пирамида',              en: 'Pyramid',             lat: 51.0960, lng: 71.4095 },
      { ru: 'ЭКСПО',               kz: 'EXPO',                  en: 'EXPO',                lat: 51.0940, lng: 71.4018 },
      { ru: 'Туран',               kz: 'Тұран',                 en: 'Turan',               lat: 51.1050, lng: 71.3900 },
      { ru: 'Алтын Орда',          kz: 'Алтын Орда',            en: 'Altyn Orda',          lat: 51.0780, lng: 71.3800 },
      { ru: 'Мега Силкуэй',        kz: 'Мега Силкуэй',          en: 'Mega Silkway',        lat: 51.0730, lng: 71.4050 },
    ],
    '3':  [
      { ru: 'Площадь Республики',  kz: 'Республика алаңы',      en: 'Republic Square',     lat: 51.1599, lng: 71.4465 },
      { ru: 'ЦУМ',                 kz: 'ЦУМ',                   en: 'Central Dept Store',  lat: 51.1525, lng: 71.4360 },
      { ru: 'Ул. Сейфуллина',      kz: 'Сейфуллин к.',          en: 'Seifullin St.',       lat: 51.1650, lng: 71.4300 },
      { ru: 'Беговая',             kz: 'Беговая',               en: 'Begovaya',            lat: 51.1720, lng: 71.4200 },
      { ru: 'Астана-1',            kz: 'Астана-1',              en: 'Astana-1',            lat: 51.1900, lng: 71.4380 },
      { ru: 'Водный центр',        kz: 'Су орталығы',           en: 'Water Center',        lat: 51.1870, lng: 71.4580 },
      { ru: 'Чубары',              kz: 'Шұбар',                 en: 'Chubary',             lat: 51.1800, lng: 71.4700 },
    ],
    '5':  [
      { ru: 'ЭКСПО',               kz: 'EXPO',                  en: 'EXPO',                lat: 51.0940, lng: 71.4018 },
      { ru: 'Хан Шатыр',          kz: 'Хан Шатыр',             en: 'Khan Shatyr',         lat: 51.1299, lng: 71.4030 },
      { ru: 'Байтерек',            kz: 'Бәйтерек',              en: 'Baiterek',            lat: 51.1283, lng: 71.4300 },
      { ru: 'Дом Министерств',     kz: 'Министрліктер үйі',     en: 'House of Ministries', lat: 51.1380, lng: 71.4280 },
      { ru: 'Абай',                kz: 'Абай',                  en: 'Abai',                lat: 51.1600, lng: 71.4220 },
      { ru: 'ЦУМ',                 kz: 'ЦУМ',                   en: 'Central Dept Store',  lat: 51.1525, lng: 71.4360 },
      { ru: 'Площадь Республики',  kz: 'Республика алаңы',      en: 'Republic Square',     lat: 51.1599, lng: 71.4465 },
      { ru: 'ЖД Вокзал',          kz: 'Теміржол вокзалы',      en: 'Railway Station',     lat: 51.1762, lng: 71.4468 },
    ],
    '7':  [
      { ru: 'Байтерек',            kz: 'Бәйтерек',              en: 'Baiterek',            lat: 51.1283, lng: 71.4300 },
      { ru: 'Нур-Жол бульвар',     kz: 'Нұр-Жол бульвары',      en: 'Nur-Zhol Boulevard',  lat: 51.1211, lng: 71.4305 },
      { ru: 'Медгородок',          kz: 'Медицина қаласы',        en: 'Medical City',        lat: 51.1050, lng: 71.4350 },
      { ru: 'Шоссе Алматы',        kz: 'Алматы тас жолы',       en: 'Almaty Highway',      lat: 51.0700, lng: 71.4500 },
      { ru: 'Аэропорт',            kz: 'Әуежай',                en: 'Airport',             lat: 51.0224, lng: 71.4665 },
    ],
    '10': [
      { ru: 'ЖД Вокзал',          kz: 'Теміржол вокзалы',      en: 'Railway Station',     lat: 51.1762, lng: 71.4468 },
      { ru: 'Площадь Республики',  kz: 'Республика алаңы',      en: 'Republic Square',     lat: 51.1599, lng: 71.4465 },
      { ru: 'Дом Министерств',     kz: 'Министрліктер үйі',     en: 'House of Ministries', lat: 51.1380, lng: 71.4280 },
      { ru: 'Байтерек',            kz: 'Бәйтерек',              en: 'Baiterek',            lat: 51.1283, lng: 71.4300 },
      { ru: 'Хан Шатыр',          kz: 'Хан Шатыр',             en: 'Khan Shatyr',         lat: 51.1299, lng: 71.4030 },
      { ru: 'Нур-Жол бульвар',     kz: 'Нұр-Жол бульвары',      en: 'Nur-Zhol Boulevard',  lat: 51.1211, lng: 71.4305 },
      { ru: 'Водный центр',        kz: 'Су орталығы',           en: 'Water Center',        lat: 51.1870, lng: 71.4580 },
      { ru: 'ЖК Нурсая',          kz: 'Нурсая кешені',         en: 'Nursaya Complex',     lat: 51.1900, lng: 71.4720 },
    ],
    '12': [
      { ru: 'Байтерек',            kz: 'Бәйтерек',              en: 'Baiterek',            lat: 51.1283, lng: 71.4300 },
      { ru: 'Проспект Туран',      kz: 'Тұран даңғылы',         en: 'Turan Avenue',        lat: 51.1200, lng: 71.4150 },
      { ru: 'ЦУМ',                 kz: 'ЦУМ',                   en: 'Central Dept Store',  lat: 51.1525, lng: 71.4360 },
      { ru: 'Рынок',               kz: 'Базар',                 en: 'Market',              lat: 51.1480, lng: 71.4420 },
      { ru: 'Серпін',              kz: 'Серпін',                en: 'Serpin',              lat: 51.1470, lng: 71.4500 },
      { ru: 'Сарыарка',            kz: 'Сарыарқа',              en: 'Saryarka',            lat: 51.1700, lng: 71.4550 },
      { ru: 'Промышленная зона',   kz: 'Өнеркәсіп аймағы',     en: 'Industrial Zone',     lat: 51.1500, lng: 71.5100 },
    ],
    '14': [
      { ru: 'Кабанбай батыр',      kz: 'Қабанбай батыр',        en: 'Kabanbai Batyr',      lat: 51.1210, lng: 71.4150 },
      { ru: 'Абай',                kz: 'Абай',                  en: 'Abai',                lat: 51.1600, lng: 71.4220 },
      { ru: 'Беговая',             kz: 'Беговая',               en: 'Begovaya',            lat: 51.1720, lng: 71.4200 },
      { ru: 'Астана-1',            kz: 'Астана-1',              en: 'Astana-1',            lat: 51.1900, lng: 71.4380 },
      { ru: 'Сарыарка',            kz: 'Сарыарқа',              en: 'Saryarka',            lat: 51.1700, lng: 71.4550 },
      { ru: 'ЖК Нурсая',          kz: 'Нурсая кешені',         en: 'Nursaya Complex',     lat: 51.1900, lng: 71.4720 },
    ],
    '18': [
      { ru: 'Хан Шатыр',          kz: 'Хан Шатыр',             en: 'Khan Shatyr',         lat: 51.1299, lng: 71.4030 },
      { ru: 'ЭКСПО',               kz: 'EXPO',                  en: 'EXPO',                lat: 51.0940, lng: 71.4018 },
      { ru: 'Дипломатический городок', kz: 'Дипломатиялық қала', en: 'Diplomatic Town',    lat: 51.1215, lng: 71.3850 },
      { ru: 'Нажимеденов',         kz: 'Нәжімеденов',           en: 'Nazhimedenov',        lat: 51.1380, lng: 71.3900 },
      { ru: 'Квартал А',           kz: 'А кварталы',            en: 'Quarter A',           lat: 51.1350, lng: 71.3950 },
    ],
    '21': [
      { ru: 'Нур-Жол бульвар',     kz: 'Нұр-Жол бульвары',      en: 'Nur-Zhol Boulevard',  lat: 51.1211, lng: 71.4305 },
      { ru: 'Конгресс-холл',       kz: 'Конгресс-холл',         en: 'Congress Hall',       lat: 51.0850, lng: 71.3947 },
      { ru: 'Пирамида',            kz: 'Пирамида',              en: 'Pyramid',             lat: 51.0960, lng: 71.4095 },
      { ru: 'Беговая',             kz: 'Беговая',               en: 'Begovaya',            lat: 51.1720, lng: 71.4200 },
      { ru: 'Кабанбай батыр',      kz: 'Қабанбай батыр',        en: 'Kabanbai Batyr',      lat: 51.1210, lng: 71.4150 },
      { ru: 'Чубары',              kz: 'Шұбар',                 en: 'Chubary',             lat: 51.1800, lng: 71.4700 },
    ],
    '22': [
      { ru: 'ЖД Вокзал',          kz: 'Теміржол вокзалы',      en: 'Railway Station',     lat: 51.1762, lng: 71.4468 },
      { ru: 'Площадь Республики',  kz: 'Республика алаңы',      en: 'Republic Square',     lat: 51.1599, lng: 71.4465 },
      { ru: 'Абай',                kz: 'Абай',                  en: 'Abai',                lat: 51.1600, lng: 71.4220 },
      { ru: 'ЦУМ',                 kz: 'ЦУМ',                   en: 'Central Dept Store',  lat: 51.1525, lng: 71.4360 },
      { ru: 'Проспект Туран',      kz: 'Тұран даңғылы',         en: 'Turan Avenue',        lat: 51.1200, lng: 71.4150 },
      { ru: 'Дом Министерств',     kz: 'Министрліктер үйі',     en: 'House of Ministries', lat: 51.1380, lng: 71.4280 },
      { ru: 'Байтерек',            kz: 'Бәйтерек',              en: 'Baiterek',            lat: 51.1283, lng: 71.4300 },
    ],
    '28': [
      { ru: 'Сарыарка',            kz: 'Сарыарқа',              en: 'Saryarka',            lat: 51.1700, lng: 71.4550 },
      { ru: 'Площадь Республики',  kz: 'Республика алаңы',      en: 'Republic Square',     lat: 51.1599, lng: 71.4465 },
      { ru: 'ЦУМ',                 kz: 'ЦУМ',                   en: 'Central Dept Store',  lat: 51.1525, lng: 71.4360 },
      { ru: 'Абай',                kz: 'Абай',                  en: 'Abai',                lat: 51.1600, lng: 71.4220 },
      { ru: 'Дом Министерств',     kz: 'Министрліктер үйі',     en: 'House of Ministries', lat: 51.1380, lng: 71.4280 },
      { ru: 'Байтерек',            kz: 'Бәйтерек',              en: 'Baiterek',            lat: 51.1283, lng: 71.4300 },
    ],
    '35': [
      { ru: 'ЭКСПО',               kz: 'EXPO',                  en: 'EXPO',                lat: 51.0940, lng: 71.4018 },
      { ru: 'Туран',               kz: 'Тұран',                 en: 'Turan',               lat: 51.1050, lng: 71.3900 },
      { ru: 'Алтын Орда',          kz: 'Алтын Орда',            en: 'Altyn Orda',          lat: 51.0780, lng: 71.3800 },
      { ru: 'Мега Силкуэй',        kz: 'Мега Силкуэй',          en: 'Mega Silkway',        lat: 51.0730, lng: 71.4050 },
      { ru: 'Онкологический центр', kz: 'Онкология орталығы',   en: 'Oncology Center',     lat: 51.0680, lng: 71.3580 },
      { ru: 'Жеркент',             kz: 'Жеркент',               en: 'Zherkent',            lat: 51.0580, lng: 71.3430 },
    ],
    '37': [
      { ru: 'Туран',               kz: 'Тұран',                 en: 'Turan',               lat: 51.1050, lng: 71.3900 },
      { ru: 'Дипломатический городок', kz: 'Дипломатиялық қала', en: 'Diplomatic Town',    lat: 51.1215, lng: 71.3850 },
      { ru: 'Центральный стадион', kz: 'Орталық стадион',       en: 'Central Stadium',     lat: 51.1480, lng: 71.4100 },
      { ru: 'Абай',                kz: 'Абай',                  en: 'Abai',                lat: 51.1600, lng: 71.4220 },
      { ru: 'Площадь Республики',  kz: 'Республика алаңы',      en: 'Republic Square',     lat: 51.1599, lng: 71.4465 },
      { ru: 'Сарыарка',            kz: 'Сарыарқа',              en: 'Saryarka',            lat: 51.1700, lng: 71.4550 },
    ],
    '40': [
      { ru: 'Нур-Жол бульвар',     kz: 'Нұр-Жол бульвары',      en: 'Nur-Zhol Boulevard',  lat: 51.1211, lng: 71.4305 },
      { ru: 'Байтерек',            kz: 'Бәйтерек',              en: 'Baiterek',            lat: 51.1283, lng: 71.4300 },
      { ru: 'Медгородок',          kz: 'Медицина қаласы',        en: 'Medical City',        lat: 51.1050, lng: 71.4350 },
      { ru: 'Шоссе Алматы',        kz: 'Алматы тас жолы',       en: 'Almaty Highway',      lat: 51.0700, lng: 71.4500 },
      { ru: 'Аэропорт',            kz: 'Әуежай',                en: 'Airport',             lat: 51.0224, lng: 71.4665 },
    ],
    '44': [
      { ru: 'Алтын Орда',          kz: 'Алтын Орда',            en: 'Altyn Orda',          lat: 51.0780, lng: 71.3800 },
      { ru: 'Туран',               kz: 'Тұран',                 en: 'Turan',               lat: 51.1050, lng: 71.3900 },
      { ru: 'Национальный университет', kz: 'Ұлттық университет', en: 'National University', lat: 51.1320, lng: 71.4050 },
      { ru: 'Центральный стадион', kz: 'Орталық стадион',       en: 'Central Stadium',     lat: 51.1480, lng: 71.4100 },
      { ru: 'Абай',                kz: 'Абай',                  en: 'Abai',                lat: 51.1600, lng: 71.4220 },
      { ru: 'Ул. Сейфуллина',      kz: 'Сейфуллин к.',          en: 'Seifullin St.',       lat: 51.1650, lng: 71.4300 },
      { ru: 'Беговая',             kz: 'Беговая',               en: 'Begovaya',            lat: 51.1720, lng: 71.4200 },
    ],
    '50A': [
      { ru: 'ЖД Вокзал',          kz: 'Теміржол вокзалы',      en: 'Railway Station',     lat: 51.1762, lng: 71.4468 },
      { ru: 'Площадь Республики',  kz: 'Республика алаңы',      en: 'Republic Square',     lat: 51.1599, lng: 71.4465 },
      { ru: 'Байтерек',            kz: 'Бәйтерек',              en: 'Baiterek',            lat: 51.1283, lng: 71.4300 },
      { ru: 'Нур-Жол бульвар',     kz: 'Нұр-Жол бульвары',      en: 'Nur-Zhol Boulevard',  lat: 51.1211, lng: 71.4305 },
      { ru: 'Аэропорт',            kz: 'Әуежай',                en: 'Airport',             lat: 51.0224, lng: 71.4665 },
    ],
    '53': [
      { ru: 'Астана-1',            kz: 'Астана-1',              en: 'Astana-1',            lat: 51.1900, lng: 71.4380 },
      { ru: 'Сарыарка',            kz: 'Сарыарқа',              en: 'Saryarka',            lat: 51.1700, lng: 71.4550 },
      { ru: 'Площадь Республики',  kz: 'Республика алаңы',      en: 'Republic Square',     lat: 51.1599, lng: 71.4465 },
      { ru: 'ЦУМ',                 kz: 'ЦУМ',                   en: 'Central Dept Store',  lat: 51.1525, lng: 71.4360 },
      { ru: 'Абай',                kz: 'Абай',                  en: 'Abai',                lat: 51.1600, lng: 71.4220 },
      { ru: 'Центральный стадион', kz: 'Орталық стадион',       en: 'Central Stadium',     lat: 51.1480, lng: 71.4100 },
      { ru: 'Гранд Парк',          kz: 'Гранд Парк',            en: 'Grand Park',          lat: 51.1600, lng: 71.3890 },
    ],
    'Т1': [
      { ru: 'Площадь Республики',  kz: 'Республика алаңы',      en: 'Republic Square',     lat: 51.1599, lng: 71.4465 },
      { ru: 'ЦУМ',                 kz: 'ЦУМ',                   en: 'Central Dept Store',  lat: 51.1525, lng: 71.4360 },
      { ru: 'Рынок',               kz: 'Базар',                 en: 'Market',              lat: 51.1480, lng: 71.4420 },
      { ru: 'Серпін',              kz: 'Серпін',                en: 'Serpin',              lat: 51.1470, lng: 71.4500 },
      { ru: 'Сарыарка',            kz: 'Сарыарқа',              en: 'Saryarka',            lat: 51.1700, lng: 71.4550 },
    ],
    'Т2': [
      { ru: 'ЖД Вокзал',          kz: 'Теміржол вокзалы',      en: 'Railway Station',     lat: 51.1762, lng: 71.4468 },
      { ru: 'Абай',                kz: 'Абай',                  en: 'Abai',                lat: 51.1600, lng: 71.4220 },
      { ru: 'Ул. Сейфуллина',      kz: 'Сейфуллин к.',          en: 'Seifullin St.',       lat: 51.1650, lng: 71.4300 },
      { ru: 'Проспект Туран',      kz: 'Тұран даңғылы',         en: 'Turan Avenue',        lat: 51.1200, lng: 71.4150 },
      { ru: 'Дом Министерств',     kz: 'Министрліктер үйі',     en: 'House of Ministries', lat: 51.1380, lng: 71.4280 },
      { ru: 'Байтерек',            kz: 'Бәйтерек',              en: 'Baiterek',            lat: 51.1283, lng: 71.4300 },
    ],
    'Т3': [
      { ru: 'Байтерек',            kz: 'Бәйтерек',              en: 'Baiterek',            lat: 51.1283, lng: 71.4300 },
      { ru: 'Дом Министерств',     kz: 'Министрліктер үйі',     en: 'House of Ministries', lat: 51.1380, lng: 71.4280 },
      { ru: 'Национальный университет', kz: 'Ұлттық университет', en: 'National University', lat: 51.1320, lng: 71.4050 },
      { ru: 'Нур-Жол бульвар',     kz: 'Нұр-Жол бульвары',      en: 'Nur-Zhol Boulevard',  lat: 51.1211, lng: 71.4305 },
    ],
    'Т4': [
      { ru: 'Беговая',             kz: 'Беговая',               en: 'Begovaya',            lat: 51.1720, lng: 71.4200 },
      { ru: 'Ул. Сейфуллина',      kz: 'Сейфуллин к.',          en: 'Seifullin St.',       lat: 51.1650, lng: 71.4300 },
      { ru: 'Площадь Республики',  kz: 'Республика алаңы',      en: 'Republic Square',     lat: 51.1599, lng: 71.4465 },
      { ru: 'ЦУМ',                 kz: 'ЦУМ',                   en: 'Central Dept Store',  lat: 51.1525, lng: 71.4360 },
    ],
    'Т5': [
      { ru: 'Кабанбай батыр',      kz: 'Қабанбай батыр',        en: 'Kabanbai Batyr',      lat: 51.1210, lng: 71.4150 },
      { ru: 'Проспект Туран',      kz: 'Тұран даңғылы',         en: 'Turan Ave.',          lat: 51.1200, lng: 71.4150 },
      { ru: 'Площадь Республики',  kz: 'Республика алаңы',      en: 'Republic Square',     lat: 51.1599, lng: 71.4465 },
      { ru: 'Сарыарка',            kz: 'Сарыарқа',              en: 'Saryarka',            lat: 51.1700, lng: 71.4550 },
    ],
    'С1': [
      { ru: 'ЖД Вокзал',          kz: 'Теміржол вокзалы',      en: 'Railway Station',     lat: 51.1762, lng: 71.4468 },
      { ru: 'Площадь Республики',  kz: 'Республика алаңы',      en: 'Republic Square',     lat: 51.1599, lng: 71.4465 },
      { ru: 'Байтерек',            kz: 'Бәйтерек',              en: 'Baiterek',            lat: 51.1283, lng: 71.4300 },
      { ru: 'Хан Шатыр',          kz: 'Хан Шатыр',             en: 'Khan Shatyr',         lat: 51.1299, lng: 71.4030 },
      { ru: 'Нур-Жол бульвар',     kz: 'Нұр-Жол бульвары',      en: 'Nur-Zhol Boulevard',  lat: 51.1211, lng: 71.4305 },
      { ru: 'Конгресс-холл',       kz: 'Конгресс-холл',         en: 'Congress Hall',       lat: 51.0850, lng: 71.3947 },
      { ru: 'ЭКСПО',               kz: 'EXPO',                  en: 'EXPO',                lat: 51.0940, lng: 71.4018 },
    ],
    'С2': [
      { ru: 'Байтерек',            kz: 'Бәйтерек',              en: 'Baiterek',            lat: 51.1283, lng: 71.4300 },
      { ru: 'Нур-Жол бульвар',     kz: 'Нұр-Жол бульвары',      en: 'Nur-Zhol Boulevard',  lat: 51.1211, lng: 71.4305 },
      { ru: 'Медгородок',          kz: 'Медицина қаласы',        en: 'Medical City',        lat: 51.1050, lng: 71.4350 },
      { ru: 'Шоссе Алматы',        kz: 'Алматы тас жолы',       en: 'Almaty Highway',      lat: 51.0700, lng: 71.4500 },
      { ru: 'Аэропорт',            kz: 'Әуежай',                en: 'Airport',             lat: 51.0224, lng: 71.4665 },
    ],
  };

  const schedulesBase = ['06:00','06:30','07:00','07:30','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'];

    const insertRouteQuery = `
      INSERT INTO routes (number, type, name_ru, name_kz, name_en,
        from_stop_ru, from_stop_kz, from_stop_en,
        to_stop_ru, to_stop_kz, to_stop_en, interval_min, color)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `;

    const insertStopQuery = `
      INSERT INTO stops (route_id, name_ru, name_kz, name_en, order_num, lat, lng)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    const insertScheduleQuery = `
      INSERT INTO schedules (route_id, departure, direction, days) VALUES ($1, $2, 'forward', $3)
    `;

    try {
      await db.query('BEGIN');
      for (const routeData of routes) {
        const routeValues = [
          routeData.number, routeData.type, routeData.name_ru, routeData.name_kz, routeData.name_en,
          routeData.from_stop_ru, routeData.from_stop_kz, routeData.from_stop_en,
          routeData.to_stop_ru, routeData.to_stop_kz, routeData.to_stop_en, routeData.interval_min, routeData.color
        ];
        
        const routeResult = await db.query(insertRouteQuery, routeValues);
        const routeId = routeResult.rows[0].id;
        
        const stops = stopsData[routeData.number] || [];
        for (let idx = 0; idx < stops.length; idx++) {
          const stop = stops[idx];
          await db.query(insertStopQuery, [
            routeId, stop.ru, stop.kz, stop.en, idx + 1, stop.lat || null, stop.lng || null
          ]);
        }

        for (const day of ['weekday', 'weekend']) {
          for (const dep of schedulesBase) {
            await db.query(insertScheduleQuery, [routeId, dep, day]);
          }
        }
      }
      await db.query('COMMIT');
      console.log('✅ Database seeded with 25 routes!');
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

initDB();

module.exports = db;
