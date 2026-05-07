BEGIN TRANSACTION;

-- Source: C:\Users\simon\Downloads\vpga.medl.mat.26.doc
-- Notes:
-- - Members without a class marker in the document were excluded because the roster text states they have passed away.
-- - Passive members (P) are imported with active = 0.
-- - Active (A), distance (D), and temporarily inactive (AP) members are imported with active = 1.
-- - Existing password_hash and email_verified values are preserved on re-import.
-- - Magnus Karlsson had no email in the document, so a placeholder address is used.

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Kennet Adolfsson', '550204-009', 17.1, 'kennet.adolfsson1@bredband.net', 1, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET
  name = excluded.name,
  golf_id = excluded.golf_id,
  handicap = excluded.handicap,
  active = excluded.active,
  is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Kjell Andersson', '660917-009', 7.8, 'kjell.j.andersson@gmail.com', 0, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Patrik Andersson', '690305-020', 4.5, 'patrik.andersson1@tele2.se', 0, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Thomas "Berza" Berzelius', '570830-009', 17.1, 'berza@msn.com', 1, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Peter "QW" Bjurstam', '590423-013', 21.1, 'peter.bjurstam@gmail.com', 1, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Anders Björk', '530523', 17.1, 'andersalias@gmail.com', 1, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Johnny Carlsson', '721221-027', 16.8, 'oxel14@live.se', 1, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Lars-Gunnar "L-G" Carlsson', '500203-016', 14.7, 'larsgunnar.k@telia.com', 0, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Lars "Honken" Drevinger', '621115-012', 22.7, 'lars.drevinger@gmail.com', 1, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Simon Edlund', '691027-049', 16.6, 'simon@edlund.nl', 1, 1, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Göran Elvin', '450124-016', 30.2, 'elvingoran@gmail.com', 1, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Per "Pelle" Englund', '631210-006', 9.6, 'pelle.englund@bredband.net', 0, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Bo von Gegerfelt', '550626-018', 19.6, 'bosse.vongegerfelt@icloud.com', 1, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Torbjörn Gunnarsson', '580503-006', 17.9, 'torgu58@gmail.com', 1, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Roger Hilmersson', '550406-014', 31.8, 'rogerhilmersson@gmail.com', 1, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Jan Israelsson', '600703-011', 28.1, 'jan.israelson@live.se', 1, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Björn Jigander', '580306-010', 15.3, 'bjoern.jigander@gmail.com', 1, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Glenn Johansson', '670305-044', 11.1, 'glenn.johansson@mail.com', 1, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Håkan Jonsson', '591227-008', 14.7, 'hakan.jonsson2@gmail.com', 1, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Magnus "Lillen" Karlsson', '701110', 7.5, 'magnus.karlsson.701110@vpga.local', 0, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Gösta Lilja', '550110-011', 17.8, 'gosta.k.lilja@gmail.com', 1, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Håkan Lindeblad', '610120-011', 14.2, 'hakan.lindeblad@saabgroup.com', 0, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Morgan Ljungblad', '610629-011', 27.4, 'morgan.ljungblad@hotmail.com', 1, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Per Nordling', '621025-043', 36.0, 'per.nordling@pemino.com', 0, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Max Rehnlund', '581208', 12.2, 'max.rehnlund@visit.se', 0, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Urban "Ubbe" Rehnlund', '570816-011', 9.8, 'urehn@icloud.com', 1, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Clas Rydergren', '720110-008', 7.1, 'nicclas@gmail.com', 1, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Johan Rydin', '690830', 8.5, 'johan.rydin@saab.se', 0, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Tommy Simonsen', '700513', 0.0, 'thommy.simonsen@telia.com', 0, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Krisjanis Steins', '711212-016', 29.4, 'krisjanis.steins@gmail.com', 1, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Kjell Sullivan', '580409-019', 27.0, 'kjell@sullivan.se', 1, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Peter Sundkvist', '630617-012', 18.8, 'peter.sundkvist@saabgroup.com', 1, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Pär Svensson', '590604-015', 32.3, 'par.svensson@saabgroup.com', 1, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Ulf Svensson', '531123-008', 22.5, 'ulf.svensson1953@gmail.com', 1, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Viktor Svärd', '810211-025', 14.6, 'mr.viktorsvard@gmail.com', 0, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

INSERT INTO members (name, golf_id, handicap, email, active, is_admin, password_hash, email_verified)
VALUES ('Anders Tälth', '650914-035', 28.8, 'and1tal@yahoo.se', 1, 0, NULL, 0)
ON CONFLICT(email) DO UPDATE SET name = excluded.name, golf_id = excluded.golf_id, handicap = excluded.handicap, active = excluded.active, is_admin = CASE WHEN members.is_admin = 1 OR excluded.is_admin = 1 THEN 1 ELSE 0 END;

COMMIT;