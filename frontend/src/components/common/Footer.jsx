import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileText, RefreshCw, Mail, Sparkles, Instagram, FolderOpen, Wand2, Film } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Footer() {
  const { user, openAuthModal } = useAuth();

  return (
    <footer className="w-full bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-lg">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-500 flex items-center justify-center text-slate-950 shadow-md font-black">
                <Sparkles className="w-4 h-4 fill-slate-950" />
              </div>
              <span>rukhi<span className="text-yellow-500">.in</span> Studio</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              #1 AI Film Studio & Multilingual Voice Engine with 60FPS Video Generation, Character DNA Lock & Multi-Agent Orchestration.
            </p>
          </div>

          {/* Navigation & Studio Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Studio & Navigation</h4>
            <ul className="space-y-2 text-xs font-semibold">
              {user ? (
                <>
                  <li>
                    <Link to="/dashboard" className="text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-yellow-400 transition-colors flex items-center space-x-1.5">
                      <FolderOpen className="w-3.5 h-3.5 text-yellow-500" />
                      <span>Dashboard</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/ai-studio" className="text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-yellow-400 transition-colors flex items-center space-x-1.5">
                      <Wand2 className="w-3.5 h-3.5 text-yellow-500" />
                      <span>AI Caption Studio</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/studio" className="text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center space-x-1.5">
                      <Film className="w-3.5 h-3.5 text-amber-500" />
                      <span>Rukhi Film Studio</span>
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <button onClick={() => openAuthModal('login')} className="text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-yellow-400 transition-colors flex items-center space-x-1.5 cursor-pointer">
                      <Wand2 className="w-3.5 h-3.5 text-yellow-500" />
                      <span>Sign In</span>
                    </button>
                  </li>
                  <li>
                    <button onClick={() => openAuthModal('register')} className="text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-yellow-400 transition-colors flex items-center space-x-1.5 cursor-pointer">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Get Started Free</span>
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Legal Compliance Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Legal & Compliance</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/privacy" className="text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-yellow-400 transition-colors flex items-center space-x-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-yellow-400 transition-colors flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span>Terms of Service</span>
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-yellow-400 transition-colors flex items-center space-x-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                  <span>Refund & Cancellation</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Business Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Support & Contact</h4>
            <div className="flex flex-col space-y-2 text-xs">
              <div>
                <a
                  href="mailto:support@rukhi.in"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 font-bold transition-all shadow-sm"
                >
                  <Mail className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
                  <span>support@rukhi.in</span>
                </a>
              </div>

              <div>
                <a
                  href="https://www.instagram.com/rukhi.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-pink-50 dark:bg-slate-800/80 hover:bg-pink-100 dark:hover:bg-pink-950/40 border border-pink-300 dark:border-pink-500/40 text-pink-600 dark:text-pink-400 font-bold transition-all shadow-sm"
                >
                  <Instagram className="w-3.5 h-3.5 text-pink-500 dark:text-pink-400" />
                  <span>Instagram: @rukhi.in</span>
                </a>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-500 pt-1">
                Rukhi AI Studio Software SaaS Engine<br />
                Hyderabad, Telangana, India
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <div>© {new Date().getFullYear()} rukhi.in AI Studio Engine. All rights reserved.</div>
          <div className="mt-2 sm:mt-0 flex space-x-4">
            <Link to="/privacy" className="hover:text-slate-700 dark:hover:text-slate-400">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-700 dark:hover:text-slate-400">Terms</Link>
            <Link to="/refund-policy" className="hover:text-slate-700 dark:hover:text-slate-400">Refunds</Link>
            <Link to="/contact" className="hover:text-slate-700 dark:hover:text-slate-400">Contact</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
