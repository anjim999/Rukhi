import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileText, RefreshCw, Mail, Sparkles } from 'lucide-react';

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
              <span>Auto Captions AI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Professional video subtitle editor, kinetic captioning, and content creator productivity SaaS.
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
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/contact" className="hover:text-cyan-400 transition-colors flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Contact Us</span>
                </Link>
              </li>
              <li>
                <a href="mailto:support@rukhi.in" className="hover:text-cyan-400 transition-colors">
                  support@rukhi.in
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/rukhi.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-pink-400 transition-colors flex items-center space-x-1.5 font-bold text-pink-400"
                >
                  <span>📸 Instagram: @rukhi.in</span>
                </a>
              </li>
            </ul>
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
