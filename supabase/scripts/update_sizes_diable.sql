-- Actualitza les talles de casaca i pantaló de diable (camp sizes JSONB)
-- Usa || per fer merge i no sobreescriure tabaler/own_suit_tabaler/gear_*
-- Executa des del SQL Editor de Supabase o amb psql

UPDATE profiles AS p
SET sizes = sizes || v.patch
FROM (VALUES
  -- === VESTIT PROPI (own_suit_foc = true) ===
  ('Moròs',              '{"own_suit_foc":true}'::jsonb),
  ('AngryPedra',         '{"own_suit_foc":true}'),
  ('Ignaso',             '{"own_suit_foc":true}'),
  ('Carles',             '{"own_suit_foc":true}'),
  ('espurnes',           '{"own_suit_foc":true}'),
  ('Ana Llopi',          '{"own_suit_foc":true}'),
  ('Anna M.',            '{"own_suit_foc":true}'),
  ('Valls',              '{"own_suit_foc":true}'),
  ('Crixa',              '{"own_suit_foc":true}'),
  ('Uri R',              '{"own_suit_foc":true}'),
  ('Papus',              '{"own_suit_foc":true}'),
  ('Pau Sancho',         '{"own_suit_foc":true}'),
  ('Laura',              '{"own_suit_foc":true}'),
  ('olmedo',             '{"own_suit_foc":true}'),
  ('Xarly',              '{"own_suit_foc":true}'),
  -- === TALLES (casaca / pantaló) ===
  ('RegiLove',           '{"casaca":"P+","pantalo":"P+","own_suit_foc":false}'),
  ('Agnious',            '{"casaca":"P","pantalo":"P","own_suit_foc":false}'),
  ('Genious',            '{"casaca":"M","pantalo":"M","own_suit_foc":false}'),
  ('Aliiisha',           '{"casaca":"P+","pantalo":"P+","own_suit_foc":false}'),
  ('Marina',             '{"casaca":"P","pantalo":"P","own_suit_foc":false}'),
  ('Nito',               '{"casaca":"M","pantalo":"M","own_suit_foc":false}'),
  ('Nin',                '{"casaca":"M","pantalo":"M","own_suit_foc":false}'),
  ('Carmeta',            '{"casaca":"P+","pantalo":"P+","own_suit_foc":false}'),
  ('Arturo',             '{"casaca":"M+","pantalo":"M+","own_suit_foc":false}'),
  ('Elena',              '{"casaca":"P+","pantalo":"P+","own_suit_foc":false}'),
  ('Monica',             '{"casaca":"P","pantalo":"P","own_suit_foc":false}'),
  ('Olguins',            '{"casaca":"M+","pantalo":"M+","own_suit_foc":false}'),
  ('Cano',               '{"casaca":"M","pantalo":"M","own_suit_foc":false}'),
  ('Alba',               '{"casaca":"M+","pantalo":"M+","own_suit_foc":false}'),
  ('Surda / Lladó Gran', '{"casaca":"P+","pantalo":"M","own_suit_foc":false}'),
  ('Ru',                 '{"casaca":"P+","pantalo":"M+","own_suit_foc":false}'),
  ('Jefa',               '{"casaca":"P","pantalo":"M","own_suit_foc":false}'),
  ('Elia',               '{"casaca":"P+","pantalo":"P+","own_suit_foc":false}'),
  ('Gemma R',            '{"casaca":"P+","pantalo":"M","own_suit_foc":false}'),
  ('Fran',               '{"casaca":"M+","pantalo":"M+","own_suit_foc":false}'),
  ('Ignífuga',           '{"casaca":"P","pantalo":"M","own_suit_foc":false}'),
  ('Josie',              '{"casaca":"P+","pantalo":"P+","own_suit_foc":false}'),
  ('Blankins',           '{"casaca":"P","pantalo":"P","own_suit_foc":false}'),
  ('Alcalà',             '{"casaca":"M+","pantalo":"M+","own_suit_foc":false}'),
  ('Pau',                '{"casaca":"M+","pantalo":"M+","own_suit_foc":false}'),
  ('Xinu',               '{"casaca":"P+","pantalo":"P+","own_suit_foc":false}'),
  ('Sonieta',            '{"casaca":"P","pantalo":"M","own_suit_foc":false}'),
  ('Tato',               '{"casaca":"M+","pantalo":"M+","own_suit_foc":false}'),
  ('xavi',               '{"casaca":"M+","pantalo":"M","own_suit_foc":false}'),
  ('Xavideparets',       '{"casaca":"M+","pantalo":"M+","own_suit_foc":false}'),
  ('Filippo',            '{"casaca":"M+","pantalo":"M+","own_suit_foc":false}'),
  ('Ana Palomo',         '{"casaca":"M","pantalo":"M","own_suit_foc":false}'),
  ('Teclea',             '{"casaca":"P+","pantalo":"M+","own_suit_foc":false}'),
  ('Esther',             '{"casaca":"M","pantalo":"M","own_suit_foc":false}'),
  ('Carlos tete',        '{"casaca":"P+","pantalo":"P+","own_suit_foc":false}'),
  ('Paula',              '{"casaca":"P","pantalo":"P","own_suit_foc":false}'),
  ('Helena',             '{"casaca":"P+","pantalo":"P+","own_suit_foc":false}'),
  ('Marta',              '{"casaca":"M","pantalo":"M","own_suit_foc":false}'),
  ('Cami',               '{"casaca":"M+","pantalo":"M+","own_suit_foc":false}'),
  ('Topillo',            '{"casaca":"M","pantalo":"M","own_suit_foc":false}'),
  ('Lucho',              '{"casaca":"M","pantalo":"M","own_suit_foc":false}'),
  ('Laia',               '{"casaca":"P+","pantalo":"P+","own_suit_foc":false}'),
  ('MariaV',             '{"casaca":"L","pantalo":"L","own_suit_foc":false}'),
  ('Sara',               '{"casaca":"M+","pantalo":"M+","own_suit_foc":false}'),
  ('Guillem_G',          '{"casaca":"M","pantalo":"M","own_suit_foc":false}'),
  ('Sara dlp',           '{"casaca":"P+","pantalo":"P+","own_suit_foc":false}'),
  ('Ramona',             '{"casaca":"P+","pantalo":"P+","own_suit_foc":false}'),
  ('Mari',               '{"casaca":"L","pantalo":"L","own_suit_foc":false}'),
  ('Ana',                '{"casaca":"M","pantalo":"M","own_suit_foc":false}'),
  ('Gabi',               '{"casaca":"L","pantalo":"L","own_suit_foc":false}'),
  ('Diablillo',          '{"casaca":"M","pantalo":"M","own_suit_foc":false}'),
  ('Claudia',            '{"casaca":"P+","pantalo":"P+","own_suit_foc":false}'),
  ('Andreu',             '{"casaca":"P+","pantalo":"P+","own_suit_foc":false}'),
  ('Maria VF',           '{"casaca":"P+","pantalo":"P+","own_suit_foc":false}')
) AS v(nick, patch)
WHERE lower(trim(p.nickname)) = lower(trim(v.nick));

-- Verifica els resultats:
-- SELECT nickname, sizes->>'casaca' AS casaca, sizes->>'pantalo' AS pantalo, (sizes->>'own_suit_foc')::boolean AS propi
-- FROM profiles
-- WHERE nickname IS NOT NULL
-- ORDER BY nickname;
