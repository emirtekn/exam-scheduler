-- =============================================================================
-- Sinavlar.OturumID -> NULL kabul eder (planlama aşamasında oturum atanmamış)
-- SSMS'te FakulteSinavSistemiDB seçili iken çalıştırın.
-- =============================================================================
USE [FakulteSinavSistemiDB];
GO

-- Mevcut dummy oturumlu (henüz salon atanmamış) kayıtları NULL yap
UPDATE s
SET s.OturumID = NULL
FROM Sinavlar s
WHERE NOT EXISTS (SELECT 1 FROM Sinav_Salonlari ss WHERE ss.SinavID = s.SinavID);
GO

-- FK: önce eski constraint'i kaldır, nullable FK ekle
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Sinavlar_Oturumlar')
    ALTER TABLE [dbo].[Sinavlar] DROP CONSTRAINT [FK_Sinavlar_Oturumlar];
GO

ALTER TABLE [dbo].[Sinavlar]
    ALTER COLUMN [OturumID] INT NULL;
GO

ALTER TABLE [dbo].[Sinavlar] WITH CHECK
    ADD CONSTRAINT [FK_Sinavlar_Oturumlar] FOREIGN KEY([OturumID])
    REFERENCES [dbo].[Oturumlar] ([OturumID]);
GO

-- UQ_Sinav: aynı ders + tarih + NULL oturum yalnızca bir kez (planlama)
-- Oturum atandıktan sonra benzersizlik oturum ile sağlanır.
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UQ_Sinav' AND object_id = OBJECT_ID(N'dbo.Sinavlar'))
    ALTER TABLE [dbo].[Sinavlar] DROP CONSTRAINT [UQ_Sinav];
GO

ALTER TABLE [dbo].[Sinavlar]
    ADD CONSTRAINT [UQ_Sinav] UNIQUE NONCLUSTERED ([DersID] ASC, [Tarih] ASC, [OturumID] ASC);
GO

PRINT 'Sinavlar.OturumID artık NULL kabul ediyor. Planlama kayıtları güncellendi.';
GO
