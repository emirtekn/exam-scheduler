-- ============================================================================
-- KURAL 9 (Arka Arkaya Max 3 Oturum) SQL Function
-- ============================================================================
-- Bu function, bir gözetmen belirli bir gün ve oturumda atanırsa,
-- arka arkaya 4+ oturum oluşup oluşmayacağını kontrol eder.
-- Dönen Değer:
--   1 = Limit aşılacak (3+ ardışık oturum var, 4. oturum engelle)
--   0 = Limit aşılmayacak (atamanız yapılabilir)
-- ============================================================================

CREATE OR ALTER FUNCTION dbo.fn_GozetmenOturumLimitiGectiMi(
    @PersonelID INT,
    @Tarih DATE,
    @OturumID INT
)
RETURNS INT
AS
BEGIN
    -- Gözetmenin bu gün atandığı tüm oturum ID'lerini bul
    DECLARE @OturumIDs TABLE (OturumID INT);
    
    INSERT INTO @OturumIDs
    SELECT DISTINCT s.OturumID
    FROM Gozetmen_Atamalari ga
    JOIN Sinav_Salonlari ss ON ga.AtamaID = ss.AtamaID
    JOIN Sinavlar s ON ss.SinavID = s.SinavID
    WHERE ga.PersonelID = @PersonelID
      AND CONVERT(DATE, s.Tarih) = @Tarih;
    
    -- Hedef oturumu da ekle (sanki atanacak gibi)
    INSERT INTO @OturumIDs VALUES (@OturumID);
    
    -- Ardışık oturum sayısını hesapla
    -- Hedef oturum etrafında, geriye ve ileriye dönük ardışık kaçını say
    DECLARE @ArdisikSayisi INT = 1; -- Hedef oturum
    DECLARE @i INT = @OturumID - 1;
    
    -- Geriye dönük ardışık kontrol
    WHILE EXISTS (SELECT 1 FROM @OturumIDs WHERE OturumID = @i)
    BEGIN
        SET @ArdisikSayisi = @ArdisikSayisi + 1;
        SET @i = @i - 1;
    END
    
    -- İleriye dönük ardışık kontrol
    SET @i = @OturumID + 1;
    WHILE EXISTS (SELECT 1 FROM @OturumIDs WHERE OturumID = @i)
    BEGIN
        SET @ArdisikSayisi = @ArdisikSayisi + 1;
        SET @i = @i + 1;
    END
    
    -- 4+ ardışık oturum olacaksa 1 döner (engelle), değilse 0 döner
    RETURN CASE WHEN @ArdisikSayisi >= 4 THEN 1 ELSE 0 END;
END;
