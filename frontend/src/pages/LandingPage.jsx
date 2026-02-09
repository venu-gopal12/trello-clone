import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Layout, Users, Shield, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

const LandingPage = () => {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900">
      {/* Navbar */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm py-2' : 'bg-transparent py-4'}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Layout className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">Trello Clone</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-slate-600 hover:text-indigo-600 font-medium hidden sm:inline-flex">Log in</Button>
            </Link>
            <Link to="/register">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-transform active:scale-95">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 lg:pt-40 lg:pb-28 overflow-hidden relative">
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium mb-8 animate-fade-in-up">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
            New: Organization Workspaces
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-tight">
            Manage projects with <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">intelligence & clarity.</span>
          </h1>
          
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            The modern collaboration platform designed for high-performing teams. 
            Organize tasks, track progress, and achieve your goals without the chaos.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
               <Button size="lg" className="h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-1">
                 Start for free 
                 <ArrowRight className="ml-2 h-5 w-5" />
               </Button>
            </Link>
            <Link to="/login">
               <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900">
                 View Demo
               </Button>
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-slate-400 font-medium">
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> No credit card required</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> 14-day free trial</div>
          </div>
        </div>
        
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-[1000px] h-[600px] bg-gradient-to-b from-indigo-50/50 to-transparent rounded-full blur-3xl opacity-60 pointer-events-none" />
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to ship faster</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Powerful features that work the way you do, wrapped in a beautiful interface.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Users}
              title="Team Organizations"
              description="Create dedicated workspaces for your engineering, design, and marketing teams."
            />
            <FeatureCard 
              icon={Shield}
              title="Enterprise Security"
              description="Bank-grade encryption and role-based access control to keep your data safe."
            />
            <FeatureCard 
              icon={Zap}
              title="Real-time Activity"
              description="Watch updates happen live. Detailed audit logs track who did what and when."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 bg-white">
        <div className="container mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4 opacity-50 grayscale hover:grayscale-0 transition-all">
                <Layout className="h-6 w-6" />
                <span className="font-bold text-xl">Trello Clone</span>
            </div>
            <p className="text-slate-400 text-sm">
                &copy; {new Date().getFullYear()} Trello Clone. Crafted with precision.
            </p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="group p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 hover:-translate-y-1 transition-all duration-300">
    <div className="h-14 w-14 bg-indigo-50 group-hover:bg-indigo-600 rounded-xl flex items-center justify-center mb-6 transition-colors duration-300">
      <Icon className="h-7 w-7 text-indigo-600 group-hover:text-white transition-colors duration-300" />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-500 leading-relaxed">{description}</p>
  </div>
);

export default LandingPage;
