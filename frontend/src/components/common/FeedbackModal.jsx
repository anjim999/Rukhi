import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquarePlus, X, Star, Send, CheckCircle2, Loader2, Heart } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

export default function FeedbackModal({ isOpen, onClose, user }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState('appreciation');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Please share your feedback or feature request!');
      return;
    }

    try {
      setSubmitting(true);
      const categoryLabel = `[${rating} STAR FEEDBACK - ${category.toUpperCase()}]`;
      await axiosClient.post('/support/tickets', {
        name: user?.name || 'Valued Creator',
        email: user?.email || 'feedback@rukhi.in',
        category: 'feedback',
        subject: `${categoryLabel} User Feedback for rukhi.in`,
        message: `Rating: ${rating} / 5 Stars ⭐\nCategory: ${category}\n\nUser Feedback:\n${message.trim()}`,
        userId: user?.id || null,
      });

      setSubmitted(true);
      toast.success('Thank you! Your feedback was sent directly to our engineering team.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setMessage('');
    setRating(5);
    setSubmitted(false);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-white p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Share Your Feedback</h3>
              <p className="text-xs text-zinc-400">Help us make rukhi.in the #1 AI Studio in the world</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-lg text-white mb-1">Feedback Received! 🎉</h4>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Thank you for helping us grow. Our engineering team reviews every single submission!
              </p>
            </div>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs transition"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Star Rating */}
            <div className="space-y-1.5 text-center">
              <label className="text-zinc-300 font-bold block text-xs">How is your experience with rukhi.in?</label>
              <div className="flex items-center justify-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 transition active:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        star <= (hoverRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-zinc-700 hover:text-zinc-500'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Category selection */}
            <div className="space-y-1">
              <label className="text-zinc-300 font-bold block">Feedback Category</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'appreciation', label: '❤️ Love It' },
                  { id: 'feature_request', label: '🚀 Idea / Feature' },
                  { id: 'bug', label: '🐛 Bug Report' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition ${
                      category === c.id
                        ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback message box */}
            <div className="space-y-1">
              <label className="text-zinc-300 font-bold block">Your Suggestion / Requirement</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What features or improvements would make your reel creation experience even better?"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-400"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-400 text-black font-extrabold text-xs transition shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <Send className="w-4 h-4 text-black" />
              )}
              <span>{submitting ? 'Sending Feedback...' : 'Submit Feedback to Team'}</span>
            </button>
          </form>
        )}

      </div>
    </div>,
    document.body
  );
}
