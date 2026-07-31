import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileText, RefreshCw, Mail, Sparkles, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-slate-900 border-t border-slate-800 text-slate-400 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2 text-white font-bold text-lg">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <span>rukhi.in AI Studio</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              #1 AI Voice & Subtitle Studio featuring 60FPS kinetic captioning and multi-lingual speech synthesis.
            </p>
          </div>

          {/* Legal Compliance Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Legal & Compliance</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/privacy" className="hover:text-cyan-400 transition-colors flex items-center space-x-1.5">
                  <Shield className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-cyan-400 transition-colors flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Terms of Service</span>
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-cyan-400 transition-colors flex items-center space-x-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Refund & Cancellation</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Social Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Support & Social</h4>
            <div className="flex flex-col space-y-2 text-xs">
              <div>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white font-bold transition-all shadow-sm hover:border-slate-600"
                >
                  <Mail className="w-4 h-4 text-cyan-400" />
                  <span>Contact Us</span>
                </Link>
              </div>

              <div>
                <a
                  href="mailto:support@rukhi.in"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white font-bold transition-all shadow-sm hover:border-slate-600"
                >
                  <Mail className="w-4 h-4 text-yellow-400" />
                  <span>support@rukhi.in</span>
                </a>
              </div>

              <div>
                <a
                  href="https://www.instagram.com/rukhi.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-pink-950/40 border border-pink-500/40 text-pink-400 hover:text-pink-300 font-bold transition-all shadow-sm hover:border-pink-500/70"
                >
                  <Instagram className="w-4 h-4 text-pink-400" />
                  <span>Instagram: @rukhi.in</span>
                </a>
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Business Info</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Auto Captions AI Software SaaS<br />
              Website: <a href="https://rukhi.in" className="text-cyan-400 hover:underline">rukhi.in</a><br />
              Hyderabad, Telangana, India
            </p>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <div>© {new Date().getFullYear()} Auto Captions AI (rukhi.in). All rights reserved.</div>
          <div className="mt-2 sm:mt-0 flex space-x-4">
            <Link to="/privacy" className="hover:text-slate-400">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-400">Terms</Link>
            <Link to="/refund-policy" className="hover:text-slate-400">Refunds</Link>
            <Link to="/contact" className="hover:text-slate-400">Contact</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
