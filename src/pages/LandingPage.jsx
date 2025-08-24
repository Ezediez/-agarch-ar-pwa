import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck, Users, Sparkles } from 'lucide-react';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';

const cardVariants = {
  offscreen: {
    y: 50,
    opacity: 0,
  },
  onscreen: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      bounce: 0.4,
      duration: 0.8,
    },
  },
};

const LandingPage = () => {
  return (
    <>
      <Helmet>
        <title>AGARCH-AR - Conexiones Reales, Sin Ataduras</title>
        <meta name="description" content="Buscamos ser una comunidad amplia y libre, que pueda conectarnos entre sí, sin prejuicios ni ataduras. AGARCH-AR es para todos." />
      </Helmet>
      <div className="min-h-screen w-full bg-background text-text-primary overflow-x-hidden">
        <LandingHeader />

        <main>
          {/* Hero Section */}
          <section 
            className="relative flex flex-col items-center justify-center text-center min-h-[80vh] p-4 pt-24 md:pt-32"
            style={{
              backgroundImage: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(244, 63, 94, 0.2), transparent)'
            }}
          >
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-7xl font-black uppercase mb-4 text-brand-red" style={{ textShadow: '0 0 20px rgba(244, 63, 94, 0.6)'}}>
              AGARCH-AR
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-8">
              Conéctate con personas afines, cerca tuyo y con ganas de hacer lo mismo que vos. Sin compromisos, sin ataduras. Solo disfruta el momento, que ¡ES AHORA!
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="btn-action text-lg group w-full sm:w-auto">
                <Link to="/register">
                  Crear Perfil
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="btn-secondary-action text-lg w-full sm:w-auto">
                <Link to="/login">
                  Iniciar Sesión
                </Link>
              </Button>
            </motion.div>
          </section>

          {/* Photo Grid Section */}
          <section className="py-16 px-4">
            <div className="container mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-fr gap-4">
                    <motion.div variants={cardVariants} initial="offscreen" whileInView="onscreen" viewport={{ once: true, amount: 0.5 }} className="rounded-lg overflow-hidden md:col-span-2 md:row-span-2">
                        <img  src="https://horizons-cdn.hostinger.com/c7a8455b-5977-4007-8c65-492384c2742e/1dd3debbb5eebe317084a1ccd3a4bf02.jpg" alt="Dos hombres y dos mujeres en lencería elegante en una habitación de lujo" className="w-full h-full object-cover"/>
                    </motion.div>
                    <motion.div variants={cardVariants} initial="offscreen" whileInView="onscreen" viewport={{ once: true, amount: 0.5 }} className="rounded-lg overflow-hidden">
                        <img  src="https://horizons-cdn.hostinger.com/c7a8455b-5977-4007-8c65-492384c2742e/bb20069474bb113043f2f1a209081635.jpg" alt="Mujer en lencería rosa en un dormitorio" className="w-full h-full object-cover"/>
                    </motion.div>
                    <motion.div variants={cardVariants} initial="offscreen" whileInView="onscreen" viewport={{ once: true, amount: 0.5 }} className="rounded-lg overflow-hidden">
                        <img  src="https://horizons-cdn.hostinger.com/c7a8455b-5977-4007-8c65-492384c2742e/d0c06b8e9a8f8dd12854427ab72ebc00.jpg" alt="Hombre sentado en un sofá mirando a una mujer en ropa interior" className="w-full h-full object-cover"/>
                    </motion.div>
                    <motion.div variants={cardVariants} initial="offscreen" whileInView="onscreen" viewport={{ once: true, amount: 0.5 }} className="rounded-lg overflow-hidden">
                        <img  src="https://horizons-cdn.hostinger.com/c7a8455b-5977-4007-8c65-492384c2742e/ba7f48d69b281b36fecf9a8584db6e8a.jpg" alt="Dos hombres durmiendo juntos en una cama iluminada por una vela" className="w-full h-full object-cover"/>
                    </motion.div>
                    <motion.div variants={cardVariants} initial="offscreen" whileInView="onscreen" viewport={{ once: true, amount: 0.5 }} className="rounded-lg overflow-hidden">
                        <img  src="https://horizons-cdn.hostinger.com/c7a8455b-5977-4007-8c65-492384c2742e/da76343598a3cc1aaf19d1a671e0d020.jpg" alt="Dos mujeres en lencería abrazándose íntimamente" className="w-full h-full object-cover"/>
                    </motion.div>
                    <motion.div variants={cardVariants} initial="offscreen" whileInView="onscreen" viewport={{ once: true, amount: 0.5 }} className="rounded-lg overflow-hidden md:col-span-2">
                        <img  src="https://horizons-cdn.hostinger.com/c7a8455b-5977-4007-8c65-492384c2742e/fff300368b91701d2f7f9185d824ea11.jpg" alt="Mujer elegante entre dos hombres con esmoquin en un evento de lujo" className="w-full h-full object-cover"/>
                    </motion.div>
                    <motion.div variants={cardVariants} initial="offscreen" whileInView="onscreen" viewport={{ once: true, amount: 0.5 }} className="rounded-lg overflow-hidden">
                        <img  src="https://horizons-cdn.hostinger.com/c7a8455b-5977-4007-8c65-492384c2742e/2a8c42c6a95efcc8563147fdc45d4c50.jpg" alt="Pareja mirándose intensamente en un ambiente oscuro y romántico" className="w-full h-full object-cover"/>
                    </motion.div>
                </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20 px-4 bg-surface">
            <div className="container mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Una Comunidad Libre y Segura</h2>
              <p className="text-text-secondary max-w-3xl mx-auto mb-12">
                Buscamos ser una comunidad amplia donde puedas conectar sin prejuicios. AGARCH-AR es para todos, un ambiente de respeto donde solo buscas lo que te gusta, disfrutas y vives libremente.
              </p>
              <div className="grid md:grid-cols-3 gap-8">
                <motion.div variants={cardVariants} initial="offscreen" whileInView="onscreen" viewport={{ once: true, amount: 0.5 }} className="p-6 rounded-lg card-glass">
                  <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-xl font-bold mb-2">Seguridad Primero</h3>
                  <p className="text-text-secondary">Verificación de perfiles y un estricto código de conducta para garantizar un espacio seguro y respetuoso para todos.</p>
                </motion.div>
                <motion.div variants={cardVariants} initial="offscreen" whileInView="onscreen" viewport={{ once: true, amount: 0.5 }} className="p-6 rounded-lg card-glass">
                  <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-xl font-bold mb-2">Conexiones Auténticas</h3>
                  <p className="text-text-secondary">Encuentra personas con tus mismos intereses y cerca de ti. La conexión ideal está más cerca de lo que piensas.</p>
                </motion.div>
                <motion.div variants={cardVariants} initial="offscreen" whileInView="onscreen" viewport={{ once: true, amount: 0.5 }} className="p-6 rounded-lg card-glass">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-xl font-bold mb-2">Experiencia Premium</h3>
                  <p className="text-text-secondary">Con un único pago de registro de 1 USD, accede a una comunidad exclusiva y desbloquea funciones avanzadas.</p>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Security Info Section */}
          <section className="py-20 px-4">
            <div className="container mx-auto text-center max-w-4xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Tu Seguridad es Nuestra Prioridad</h2>
              <p className="text-text-secondary mb-6">
                Al registrar tu perfil, aceptas nuestros términos, condiciones y políticas de privacidad y seguridad. Esta aplicación prohíbe estrictamente el uso a menores de edad, desnudos no consentidos, violencia de género, pedofilia, trata de personas y prostitución.
              </p>
              <p className="text-text-secondary font-semibold">
                Para validar y activar tu perfil, se requiere un pago único de 1 USD. Esto nos ayuda a mantener una comunidad de usuarios reales y comprometidos, dándote acceso completo a la plataforma y la posibilidad de desbloquear beneficios extras.
              </p>
            </div>
          </section>
        </main>

        <LandingFooter />
      </div>
    </>
  );
};

export default LandingPage;