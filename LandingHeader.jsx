import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Menu, Briefcase, FileText, Gavel, Shield } from 'lucide-react';
import LegalRequestForm from '@/components/landing/LegalRequestForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';

const LandingHeader = () => {
  const [isLegalFormOpen, setIsLegalFormOpen] = useState(false);
  const { user, profile } = useAuth();
  const isAdmin = user && profile?.role === 'admin';
  const advertisingMenuEnabled = false;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Legal Requirements Button */}
        <Dialog open={isLegalFormOpen} onOpenChange={setIsLegalFormOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" className="text-text-secondary hover:text-text-primary">
              <Gavel className="mr-2 h-4 w-4" />
              Requerimientos Legales
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-surface border-border-color text-text-primary">
            <DialogHeader>
              <DialogTitle>Formulario para Entidades Judiciales y de Seguridad</DialogTitle>
              <DialogDescription>
                Complete este formulario para solicitar información legal de la plataforma
              </DialogDescription>
            </DialogHeader>
            <LegalRequestForm setOpen={setIsLegalFormOpen} />
          </DialogContent>
        </Dialog>

        {/* Hamburger Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-surface border-border-color text-text-primary">
            <SheetHeader>
              <SheetTitle>Menú de Navegación</SheetTitle>
              <SheetDescription>
                Accede a las diferentes secciones de la plataforma
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col space-y-4 pt-8">
              {advertisingMenuEnabled && (
                <>
                  <SheetClose asChild>
                    <Link to="/ad-register" className="flex items-center p-2 rounded-md hover:bg-border-color">
                      <Briefcase className="mr-3 h-5 w-5 text-primary" />
                      <span>Registro Publicitario</span>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link to="/ad-login" className="flex items-center p-2 rounded-md hover:bg-border-color">
                      <Briefcase className="mr-3 h-5 w-5 text-primary" />
                      <span>Inicio Cuenta Publicidad</span>
                    </Link>
                  </SheetClose>
                </>
              )}
              <SheetClose asChild>
                <Link to="/terms" className="flex items-center p-2 rounded-md hover:bg-border-color">
                  <FileText className="mr-3 h-5 w-5 text-primary" />
                  <span>Términos y Seguridad</span>
                </Link>
              </SheetClose>
              {isAdmin && (
                <SheetClose asChild>
                  <Link to="/admin" className="flex items-center p-2 rounded-md hover:bg-border-color">
                    <Shield className="mr-3 h-5 w-5 text-primary" />
                    <span>Panel de Administración</span>
                  </Link>
                </SheetClose>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
};

export default LandingHeader;
