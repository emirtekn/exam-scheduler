-- ============================================================================
-- Veritabanı Yedekleme Stored Procedure
-- Kullanım: EXEC sp_VeritabaniYedegiAl
-- Bu SP çalıştırıldığında C:\Yedekler klasörüne tarih-saat damgasıyla .bak dosyası oluşturur
-- ============================================================================

CREATE OR ALTER PROCEDURE sp_VeritabaniYedegiAl
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @BackupPath NVARCHAR(MAX);
    DECLARE @FileName NVARCHAR(MAX);
    DECLARE @BackupCommand NVARCHAR(MAX);
    DECLARE @DatabaseName NVARCHAR(128);
    DECLARE @DirectoryExists INT;

    -- Veritabanı adını al
    SET @DatabaseName = DB_NAME();

    -- Yedek klasörü yolu
    SET @BackupPath = 'C:\Yedekler\';

    -- Dosya adını oluştur: FakulteSinavSistemiDB_20260530_143025.bak
    SET @FileName = @BackupPath + @DatabaseName + '_' + 
                    REPLACE(REPLACE(REPLACE(CONVERT(VARCHAR(19), GETDATE(), 120), '-', ''), ' ', '_'), ':', '') + '.bak';

    BEGIN TRY
        -- Klasörün varlığını kontrol et (xp_cmdshell kullanmaktan kaçınmak için)
        -- Eğer klasör yoksa dinamik olarak oluşturmaya çalış
        EXEC xp_create_subdir @BackupPath;

        -- Yedek komutu oluştur (STATS kaldırıldı - JDBC uyarısı vermesine engel olmak için)
        SET @BackupCommand = 'BACKUP DATABASE [' + @DatabaseName + '] TO DISK = N''' + @FileName + '''
                              WITH NOFORMAT, NOINIT, NAME = N''' + @DatabaseName + ' Backup'', 
                              SKIP, NOREWIND, NOUNLOAD';

        -- Yedek işlemini gerçekleştir
        EXEC sp_executesql @BackupCommand;

        -- Başarı mesajı
        SELECT 'Yedekleme başarıyla tamamlandı!' AS Mesaj, @FileName AS DosyaYolu;

    END TRY
    BEGIN CATCH
        -- Hata yönetimi
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorNumber INT = ERROR_NUMBER();
        
        SELECT 'Yedekleme hatası!' AS Mesaj, @ErrorMessage AS HataDetaylari, @ErrorNumber AS ErrorCode;
        
    END CATCH;

END;
