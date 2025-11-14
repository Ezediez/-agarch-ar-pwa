import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Función para marcar publicidades premium como expiradas (SIN renovación automática)
 * Se ejecuta cada 24 horas para verificar expiraciones
 */
export const expirePremiumAds = async () => {
  try {
    console.log('⏰ Verificando publicidades premium expiradas...');
    
    // Obtener publicidades premium expiradas
    const adsRef = collection(db, 'advertisements');
    const now = new Date();
    
    const adsQuery = query(
      adsRef,
      where('ad_type', '==', 'premium'),
      where('status', '==', 'active'),
      where('expires_at', '<=', now)
    );
    
    const snapshot = await getDocs(adsQuery);
    let expired = 0;
    
    for (const docSnapshot of snapshot.docs) {
      try {
        const adRef = doc(db, 'advertisements', docSnapshot.id);
        await updateDoc(adRef, { 
          status: 'expired',
          expired_at: now
        });
        expired++;
        console.log(`⏰ Publicidad premium expirada: ${docSnapshot.id}`);
      } catch (error) {
        console.error(`❌ Error expirando publicidad ${docSnapshot.id}:`, error);
      }
    }
    
    console.log(`⏰ Verificación completada: ${expired} publicidades premium expiradas`);
    return { expired };
    
  } catch (error) {
    console.error('❌ Error verificando publicidades expiradas:', error);
    throw error;
  }
};

/**
 * Función para limpiar publicidades estándar expiradas
 * Se ejecuta cada hora
 */
export const cleanupStandardAds = async () => {
  try {
    console.log('🧹 Limpiando publicidades estándar expiradas...');
    
    const adsRef = collection(db, 'advertisements');
    const now = new Date();
    
    const adsQuery = query(
      adsRef,
      where('ad_type', '==', 'standard'),
      where('status', '==', 'active'),
      where('expires_at', '<=', now)
    );
    
    const snapshot = await getDocs(adsQuery);
    let cleaned = 0;
    
    for (const docSnapshot of snapshot.docs) {
      try {
        const adRef = doc(db, 'advertisements', docSnapshot.id);
        await updateDoc(adRef, { 
          status: 'expired',
          expired_at: now
        });
        cleaned++;
        console.log(`🗑️ Publicidad estándar limpiada: ${docSnapshot.id}`);
      } catch (error) {
        console.error(`❌ Error limpiando publicidad ${docSnapshot.id}:`, error);
      }
    }
    
    console.log(`🧹 Limpieza completada: ${cleaned} publicidades estándar expiradas`);
    return { cleaned };
    
  } catch (error) {
    console.error('❌ Error en limpieza de publicidades:', error);
    throw error;
  }
};

/**
 * Función para renovar publicidad premium MANUALMENTE (con nuevo pago)
 */
export const renewPremiumAd = async (adId, advertiserId) => {
  try {
    console.log(`🔄 Renovando publicidad premium: ${adId}`);
    
    const adRef = doc(db, 'advertisements', adId);
    const now = new Date();
    const newExpiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 días más
    
    await updateDoc(adRef, {
      status: 'active',
      expires_at: newExpiryDate,
      last_renewed: now,
      renewal_count: (await getDoc(adRef)).data().renewal_count + 1 || 1,
      payment_status: 'completed'
    });
    
    console.log(`✅ Publicidad premium renovada: ${adId}`);
    return { success: true, new_expiry: newExpiryDate };
    
  } catch (error) {
    console.error(`❌ Error renovando publicidad ${adId}:`, error);
    throw error;
  }
};

/**
 * Función para obtener estadísticas de publicidades
 */
export const getAdStats = async (advertiserId = null) => {
  try {
    const adsRef = collection(db, 'advertisements');
    
    // Si se especifica advertiser_id, filtrar por anunciante
    const baseQuery = advertiserId 
      ? [where('advertiser_id', '==', advertiserId)]
      : [];
    
    // Contar por tipo y estado
    const [activeSnapshot, expiredSnapshot, premiumActiveSnapshot, premiumExpiredSnapshot, standardSnapshot] = await Promise.all([
      getDocs(query(adsRef, ...baseQuery, where('status', '==', 'active'))),
      getDocs(query(adsRef, ...baseQuery, where('status', '==', 'expired'))),
      getDocs(query(adsRef, ...baseQuery, where('ad_type', '==', 'premium'), where('status', '==', 'active'))),
      getDocs(query(adsRef, ...baseQuery, where('ad_type', '==', 'premium'), where('status', '==', 'expired'))),
      getDocs(query(adsRef, ...baseQuery, where('ad_type', '==', 'standard'), where('status', '==', 'active')))
    ]);
    
    return {
      total_active: activeSnapshot.size,
      total_expired: expiredSnapshot.size,
      premium_active: premiumActiveSnapshot.size,
      premium_expired: premiumExpiredSnapshot.size,
      standard_active: standardSnapshot.size,
      last_updated: new Date()
    };
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    throw error;
  }
};
