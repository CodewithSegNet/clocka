import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ImageWithFallback } from '../app/components/figma/ImageWithFallback';
import { 
  Crown, 
  ShieldCheck, 
  Smartphone, 
  MapPin, 
  Users, 
  Clock, 
  CheckCircle, 
  Star,
  Lock,
  Zap,
  TrendingUp,
  UserCheck,
  Bell,
  FileText,
  ChevronRight,
  Menu,
  X,
  ArrowRight,
  Play,
  Award,
  Heart,
  Shield,
  Phone
} from 'lucide-react';
import clockaLogo from 'figma:asset/c6c92aab0f7d59ff7afbce0ebd8b122d9715bdde.png';
import assigneeIllustration from 'figma:asset/66b5f562a88bc92a2abb3a871e4bde36713040bc.png';
import smartReportsIllustration from 'figma:asset/4a6cf7a895eaa51efbef70cc49afd068993d5601.png';
import realTimeTrackingIllustration from 'figma:asset/4f0a70d8066fa481a75743b4cbca1573ee39e30d.png';
import securePinIllustration from 'figma:asset/344cdace27bfeaf4ba9a9ba37952cca192345bb0.png';
import gpsVerificationIllustration from 'figma:asset/ef960aad01ea00cc1519d3c55901633daa72d7db.png';
import multiSchoolIllustration from 'figma:asset/c68cf5fc8291d7a1fef8ef55377c0a9d2994109c.png';

export default function Landing() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Elegant Fixed Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/98 backdrop-blur-xl border-b border-gray-100 z-50 shadow-sm px-24">
        <div className="w-full">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="relative">
                <img src={clockaLogo} alt="Clocka" className="w-12 h-12" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Crown className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0039E6] via-[#3366FF] to-purple-600 bg-clip-text text-transparent">
                  Clocka
                </h1>
                <p className="text-xs text-gray-500 font-medium tracking-wide">PREMIUM EDITION</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-10">
              <a href="#why-clocka" className="text-gray-700 hover:text-[#0039E6] transition-colors font-medium text-sm">Why Clocka</a>
              <a href="#features" className="text-gray-700 hover:text-[#0039E6] transition-colors font-medium text-sm">Features</a>
              <a href="#experience" className="text-gray-700 hover:text-[#0039E6] transition-colors font-medium text-sm">Experience</a>
              <a href="#testimonials" className="text-gray-700 hover:text-[#0039E6] transition-colors font-medium text-sm">Testimonials</a>
              <button
                onClick={() => window.open('https://wa.me/2348077784848?text=Hello,%20I%20would%20like%20to%20schedule%20a%20demo%20of%20the%20Clocka%20app', '_blank')}
                className="bg-gradient-to-r from-[#0039E6] to-[#3366FF] text-white px-8 py-3 rounded-full hover:shadow-xl hover:scale-105 transition-all font-semibold text-sm flex items-center gap-2"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-6 border-t border-gray-100">
              <nav className="flex flex-col gap-4">
                <a href="#why-clocka" className="text-gray-700 hover:text-[#0039E6] transition-colors font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Why Clocka</a>
                <a href="#features" className="text-gray-700 hover:text-[#0039E6] transition-colors font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Features</a>
                <a href="#experience" className="text-gray-700 hover:text-[#0039E6] transition-colors font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Experience</a>
                <a href="#testimonials" className="text-gray-700 hover:text-[#0039E6] transition-colors font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
                <button
                  onClick={() => window.open('https://wa.me/2348077784848?text=Hello,%20I%20would%20like%20to%20schedule%20a%20demo%20of%20the%20Clocka%20app', '_blank')}
                  className="bg-gradient-to-r from-[#0039E6] to-[#3366FF] text-white px-6 py-3 rounded-full hover:shadow-lg transition-all font-semibold mt-2"
                >
                  Get Started
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section - Full Screen with Image */}
      <section className="relative min-h-screen flex items-center pt-20">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1759143102544-790af882ff45?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGVsZW1lbnRhcnklMjBzY2hvb2wlMjBjaGlsZHJlbiUyMGNsYXNzcm9vbXxlbnwxfHx8fDE3NzA3MjE2OTR8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Happy school children"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0039E6]/95 via-[#0039E6]/85 to-purple-900/90"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full px-24 py-24">
          <div className="max-w-4xl">
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-2.5 bg-white/20 backdrop-blur-md border border-white/30 px-5 py-2.5 rounded-full mb-8">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-white font-semibold text-sm tracking-wide">TRUSTED BY PREMIUM SCHOOLS WORLDWIDE</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 leading-[1.1] text-left">
              The Future of
              <span className="block bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent mt-2">
                School Safety
              </span>
              <span className="block text-white mt-2">Starts Here</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-blue-100 mb-12 leading-relaxed max-w-3xl text-left">
              Elevate your institution with the most sophisticated attendance management platform. 
              Where cutting-edge technology meets exceptional care for every child.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-16">
              <button
                onClick={() => window.open('https://wa.me/2348077784848?text=Hello,%20I%20would%20like%20to%20schedule%20a%20demo%20of%20the%20Clocka%20app', '_blank')}
                className="group bg-white text-[#0039E6] px-10 py-5 rounded-full hover:bg-blue-50 transition-all font-bold text-lg flex items-center gap-3 shadow-2xl hover:shadow-3xl hover:scale-105"
              >
                Schedule a Demo
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-8 text-white/90">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium">Bank-Level Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-sm font-medium">Real-Time GPS</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-orange-400" />
                <span className="text-sm font-medium">Award-Winning</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-2 bg-white rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Why Clocka Section */}
      <section id="why-clocka" className="py-32 px-24 bg-white">
        <div className="w-full">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Left - Content */}
            <div className="order-2 lg:order-1">
              <div className="inline-block bg-blue-50 text-[#0039E6] px-4 py-2 rounded-full text-sm font-bold mb-6">
                WHY PREMIUM SCHOOLS CHOOSE CLOCKA
              </div>
              
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight text-left">
                Peace of Mind,
                <span className="block bg-gradient-to-r from-[#0039E6] to-purple-600 bg-clip-text text-transparent mt-2">
                  Guaranteed
                </span>
              </h2>

              <p className="text-xl text-gray-600 mb-10 leading-relaxed text-left">
                Every parent deserves to know their child is safe. Every school deserves tools that make excellence effortless. 
                Clocka delivers both, beautifully.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Heart className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 text-left">Parents Love It</h3>
                    <p className="text-gray-600 leading-relaxed text-left">
                      Real-time notifications and GPS tracking give parents complete confidence in their child's safety during pickup and drop-off.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 text-left">Schools Thrive</h3>
                    <p className="text-gray-600 leading-relaxed text-left">
                      Reduce administrative overhead by 75% while enhancing your school's reputation with premium technology.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 text-left">Security First</h3>
                    <p className="text-gray-600 leading-relaxed text-left">
                      Military-grade encryption, facial verification, and multi-layer authentication protect every interaction.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => window.location.href = 'mailto:hello@clocka.com?subject=Schedule%20a%20Demo'}
                className="mt-10 bg-gradient-to-r from-[#0039E6] to-purple-600 text-white px-10 py-5 rounded-full hover:shadow-2xl transition-all font-bold text-lg inline-flex items-center gap-2"
              >
                Schedule a Demo
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Right - Image */}
            <div className="order-1 lg:order-2">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl"></div>
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1761208663763-c4d30657c910?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwbnVyc2VyeSUyMHNjaG9vbCUyMGtpZHMlMjBsZWFybmluZ3xlbnwxfHx8fDE3NzA3MjE2OTR8MA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Diverse nursery school kids learning"
                    className="w-full h-[600px] object-cover"
                  />
                  {/* Floating Stats */}
                  <div className="absolute top-8 right-8 bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
                    <div className="text-4xl font-bold bg-gradient-to-r from-[#0039E6] to-purple-600 bg-clip-text text-transparent mb-1">
                      99.9%
                    </div>
                    <p className="text-sm text-gray-600 font-semibold">Parent Satisfaction</p>
                  </div>
                  <div className="absolute bottom-8 left-8 bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
                    <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">
                      &lt;2s
                    </div>
                    <p className="text-sm text-gray-600 font-semibold">Avg. Check-in Time</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Beautiful Grid with Images */}
      <section id="features" className="py-32 px-24 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <div className="w-full">
          {/* Section Header */}
          <div className="text-left mb-20">
            <div className="inline-block bg-purple-50 text-purple-600 px-4 py-2 rounded-full text-sm font-bold mb-6">
              PREMIUM FEATURES
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 text-left">
              Crafted for
              <span className="block bg-gradient-to-r from-[#0039E6] to-purple-600 bg-clip-text text-transparent mt-2">
                Excellence
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl text-left">
              Every feature meticulously designed to deliver the premium experience your school deserves
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 - GPS Verification */}
            <div className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
              <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                <ImageWithFallback
                  src={gpsVerificationIllustration}
                  alt="GPS location illustration"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              <div className="p-8">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">GPS Verification</h3>
                <p className="text-gray-600 leading-relaxed">
                  Precision location tracking ensures check-ins only happen when parents are physically at your school.
                </p>
              </div>
            </div>

            {/* Feature 2 - Assignee System */}
            <div className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
              <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
                <ImageWithFallback
                  src={assigneeIllustration}
                  alt="Identity verification illustration"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              <div className="p-8">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                  <UserCheck className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Assignee System</h3>
                <p className="text-gray-600 leading-relaxed">
                  Parents can authorize trusted individuals with photo verification and time-limited access permissions.
                </p>
              </div>
            </div>

            {/* Feature 3 - Real-Time Tracking */}
            <div className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
              <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
                <ImageWithFallback
                  src={realTimeTrackingIllustration}
                  alt="Notification alert illustration"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              <div className="p-8">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Real-Time Tracking</h3>
                <p className="text-gray-600 leading-relaxed">
                  Instant notifications and live attendance logs keep everyone informed, every moment of every day.
                </p>
              </div>
            </div>

            {/* Feature 4 - Secure PIN Access */}
            <div className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
              <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
                <ImageWithFallback
                  src={securePinIllustration}
                  alt="Security lock illustration"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              <div className="p-8">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                  <Lock className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Secure PIN Access</h3>
                <p className="text-gray-600 leading-relaxed">
                  Simple 4-digit PIN authentication makes access quick and secure for parents on the go.
                </p>
              </div>
            </div>

            {/* Feature 5 - Multi-School Platform */}
            <div className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
              <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center">
                <ImageWithFallback
                  src={multiSchoolIllustration}
                  alt="School building illustration"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              <div className="p-8">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Multi-School Platform</h3>
                <p className="text-gray-600 leading-relaxed">
                  Manage unlimited schools with unique branding and customized portals for each institution.
                </p>
              </div>
            </div>

            {/* Feature 6 - Smart Reports */}
            <div className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
              <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
                <ImageWithFallback
                  src={smartReportsIllustration}
                  alt="Document report illustration"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              <div className="p-8">
                <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Smart Reports</h3>
                <p className="text-gray-600 leading-relaxed">
                  Beautiful, comprehensive reports with PDF export for complete transparency and record-keeping.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Experience Section - Large Image with Stats */}
      <section id="experience" className="relative py-40 px-6 lg:px-8 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1605627079912-97c3810a11a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraW5kZXJnYXJ0ZW4lMjBjaGlsZHJlbiUyMHBsYXlpbmclMjB0b2dldGhlcnxlbnwxfHx8fDE3NzA3MjE2OTV8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Children playing together"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/95 via-blue-900/90 to-indigo-900/95"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              The Clocka
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent mt-2">
                Experience
              </span>
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Numbers that speak louder than words. Results that transform schools.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-10 text-center hover:bg-white/20 transition-all">
              <div className="text-6xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent mb-3">
                99.9%
              </div>
              <p className="text-white font-semibold text-lg">System Uptime</p>
              <p className="text-blue-200 text-sm mt-2">Always available when you need it</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-10 text-center hover:bg-white/20 transition-all">
              <div className="text-6xl font-bold bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent mb-3">
                75%
              </div>
              <p className="text-white font-semibold text-lg">Time Saved</p>
              <p className="text-blue-200 text-sm mt-2">Reduce admin workload dramatically</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-10 text-center hover:bg-white/20 transition-all">
              <div className="text-6xl font-bold bg-gradient-to-r from-pink-300 to-rose-300 bg-clip-text text-transparent mb-3">
                &lt;2s
              </div>
              <p className="text-white font-semibold text-lg">Check-in Speed</p>
              <p className="text-blue-200 text-sm mt-2">Lightning-fast attendance logging</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-10 text-center hover:bg-white/20 transition-all">
              <div className="text-6xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent mb-3">
                24/7
              </div>
              <p className="text-white font-semibold text-lg">Support</p>
              <p className="text-blue-200 text-sm mt-2">Premium assistance always ready</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-32 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block bg-green-50 text-green-600 px-4 py-2 rounded-full text-sm font-bold mb-6">
              TRUSTED BY PREMIUM SCHOOLS
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              What Schools
              <span className="block bg-gradient-to-r from-[#0039E6] to-purple-600 bg-clip-text text-transparent mt-2">
                Are Saying
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-10 shadow-lg hover:shadow-xl transition-all">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 text-lg mb-8 leading-relaxed italic">
                "Clocka has transformed how we manage attendance. Parents love the real-time updates, and we've cut our admin time in half!"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">MS</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Mrs. Sarah Mitchell</p>
                  <p className="text-sm text-gray-600">Principal, Oakwood Academy</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-10 shadow-lg hover:shadow-xl transition-all">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 text-lg mb-8 leading-relaxed italic">
                "The GPS verification gives our parents complete peace of mind. It's the premium solution we've been looking for."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">DJ</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Dr. James Peterson</p>
                  <p className="text-sm text-gray-600">Director, Elite Nursery School</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-10 shadow-lg hover:shadow-xl transition-all">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 text-lg mb-8 leading-relaxed italic">
                "Best investment we've made! The assignee system is brilliant, and the support team is exceptional."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">EC</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Emma Chen</p>
                  <p className="text-sm text-gray-600">Administrator, Bright Minds School</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-32 px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0039E6] via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-300 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
            Ready to Elevate Your School?
          </h2>
          <p className="text-2xl text-blue-100 mb-12 leading-relaxed max-w-3xl mx-auto">
            Join the elite community of schools delivering exceptional experiences with Clocka
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10">
            <button
              onClick={() => window.open('https://wa.me/2348077784848?text=Hello,%20I%20would%20like%20to%20schedule%20a%20demo%20of%20the%20Clocka%20app', '_blank')}
              className="group bg-white text-[#0039E6] px-12 py-6 rounded-full hover:bg-blue-50 transition-all font-bold text-xl flex items-center gap-3 shadow-2xl hover:shadow-3xl hover:scale-105"
            >
              Schedule a Demo
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => window.open('https://wa.me/2348077784848?text=Hello,%20I%20would%20like%20to%20speak%20with%20the%20Clocka%20sales%20team', '_blank')}
              className="bg-white/10 backdrop-blur-md border-2 border-white/30 text-white px-12 py-6 rounded-full hover:bg-white/20 transition-all font-bold text-xl"
            >
              Contact Sales
            </button>
          </div>

          <p className="text-blue-200 text-sm">
            No credit card required • Premium support included • Setup in under 10 minutes
          </p>
        </div>
      </section>

      {/* Elegant Footer */}
      <footer className="bg-gray-900 text-white py-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <img src={clockaLogo} alt="Clocka" className="w-14 h-14" />
                <div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Clocka
                  </h3>
                  <p className="text-sm text-gray-400 font-medium tracking-wide">PREMIUM EDITION</p>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed max-w-md mb-6">
                The most sophisticated attendance tracking platform designed exclusively for premium nursery and primary schools. 
                Where technology meets exceptional care.
              </p>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Access */}
            <div>
              <h4 className="font-bold text-lg mb-6">Access Portals</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <button onClick={() => navigate('/super-admin/login')} className="hover:text-white transition-colors text-left">
                    Super Admin
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/admin/login')} className="hover:text-white transition-colors text-left">
                    School Admin
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/parent/login')} className="hover:text-white transition-colors text-left">
                    Parent Portal
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact Us */}
            <div>
              <h4 className="font-bold text-lg mb-6">Contact Us</h4>
              <div className="space-y-4">
                <button
                  onClick={() => window.open('https://wa.me/2348077784848?text=Hello,%20I%20would%20like%20to%20speak%20with%20the%20Clocka%20team', '_blank')}
                  className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group"
                >
                  <div className="w-10 h-10 bg-green-600/10 rounded-lg flex items-center justify-center group-hover:bg-green-600/20 transition-all">
                    <Phone className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">WhatsApp</p>
                    <p className="text-xs">08077784848</p>
                  </div>
                </button>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Available 24/7 for premium support and sales inquiries
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              © 2024 Clocka Premium Edition. All rights reserved. Designed for excellence.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}