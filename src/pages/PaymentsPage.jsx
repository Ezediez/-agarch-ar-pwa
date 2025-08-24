import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/customSupabaseClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DollarSign, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const PaymentsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPayments = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            
            setLoading(true);
            const { data, error } = await supabase
                .from('payments')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                toast({
                    variant: "destructive",
                    title: "Error al cargar pagos",
                    description: "No se pudo obtener tu historial de transacciones.",
                });
            } else {
                setPayments(data);
            }
            
            setLoading(false);
        };

        fetchPayments();
    }, [user, toast]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="loading-spinner" />
            </div>
        );
    }
    
    return (
        <>
            <Helmet>
                <title>Pagos y Suscripciones - AGARCH-AR</title>
                <meta name="description" content="Revisa tu historial de pagos y suscripciones en AGARCH-AR." />
            </Helmet>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-primary">Pagos y Suscripciones</h1>
                        <p className="text-text-secondary mt-2">
                            Aquí puedes ver un historial de todas tus transacciones.
                        </p>
                    </div>
                     <Button variant="ghost" onClick={() => navigate(-1)} className="text-primary hover:bg-primary/10">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver
                    </Button>
                </div>

                <div className="card-glass">
                    <div className="p-4 sm:p-6">
                        <h2 className="text-xl font-semibold text-primary mb-4">Historial de Transacciones</h2>
                        {payments.length === 0 ? (
                            <div className="text-center py-10">
                                <DollarSign className="mx-auto h-12 w-12 text-text-secondary" />
                                <h3 className="mt-2 text-sm font-semibold text-text-primary">Sin transacciones</h3>
                                <p className="mt-1 text-sm text-text-secondary">Aún no has realizado ningún pago.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-border-color">
                                {payments.map((payment) => (
                                    <li key={payment.id} className="flex items-center justify-between py-4">
                                        <div className="flex items-center space-x-4">
                                            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${payment.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                {payment.status === 'completed' ? <CheckCircle className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-text-primary">{payment.description}</p>
                                                <p className="text-sm text-text-secondary">
                                                    {format(new Date(payment.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-text-primary">{payment.amount.toFixed(2)} {payment.currency}</p>
                                            <p className="text-sm capitalize text-text-secondary">{payment.payment_method}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </motion.div>
        </>
    );
};

export default PaymentsPage;