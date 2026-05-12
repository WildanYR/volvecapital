'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CreditCard, CheckCircle, Clock, Copy, ArrowRight, Trash2, Zap } from 'lucide-react';
import { useNotification, Notification } from '@/hooks/use-notification';
import { toast } from 'sonner';

import { modalTrigger } from '@/lib/events';

function formatRelativeTime(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'Baru saja';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit yang lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam yang lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari yang lalu`;
}

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onReopenCheckout?: (data: any) => void;
}

export function NotificationPopover({ isOpen, onClose, onReopenCheckout }: NotificationPopoverProps) {
  const { notifications, removeNotification, markAsRead, markAllAsRead, clearNotifications } = useNotification();

  const handleCopyVoucher = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Kode voucher berhasil disalin!', {
      position: 'top-center',
      className: 'font-bold uppercase text-[10px] tracking-widest'
    });
  };

  const handleAction = (notif: Notification) => {
    markAsRead(notif.id);
    if (notif.type === 'pending') {
      if (onReopenCheckout) {
        onReopenCheckout(notif.data);
      }
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[110] bg-black/5 lg:bg-transparent"
          />
          
          {/* Popover */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed lg:absolute top-20 right-4 left-4 lg:left-auto lg:right-0 lg:w-[400px] z-[120] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[80vh] lg:max-h-[600px]"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-widest">Riwayat Belanja</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Tersimpan lokal di browser Anda
                </p>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button 
                    onClick={clearNotifications}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    title="Hapus Semua"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-[#0f172a] transition-colors">
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto p-4 space-y-3 min-h-[200px]">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center">
                    <Bell className="size-8 text-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-[#0f172a]">Belum Ada Notifikasi</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Riwayat pembelian Anda akan muncul di sini
                    </p>
                  </div>
                </div>
              ) : (
                notifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`relative p-4 rounded-2xl border transition-all ${
                      notif.isRead ? 'bg-white border-slate-100' : 'bg-orange-50/30 border-orange-100'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                        notif.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 
                        notif.type === 'pending' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'
                      }`}>
                        {notif.type === 'success' ? <CheckCircle className="size-5" /> : 
                         notif.type === 'pending' ? <CreditCard className="size-5" /> : <Clock className="size-5" />}
                      </div>
                      
                      <div className="flex-grow space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-black text-[#0f172a]">{notif.title}</p>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                              {formatRelativeTime(notif.timestamp)}
                            </span>
                            {!notif.isRead && (
                              <div className="size-1.5 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                          {notif.message}
                        </p>

                        {/* Data Display */}
                        {notif.data && (
                          <div className="mt-3 pt-3 border-t border-slate-50 space-y-2">
                            {notif.type === 'success' && notif.data.voucherCode && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                                  <code className="text-xs font-black text-emerald-700">{notif.data.voucherCode}</code>
                                  <button 
                                    onClick={() => handleCopyVoucher(notif.data?.voucherCode || '')}
                                    className="p-1 hover:bg-emerald-100 rounded transition-colors text-emerald-600"
                                  >
                                    <Copy className="size-3" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => {
                                    const voucherCode = notif.data?.voucherCode;
                                    if (voucherCode) {
                                      window.location.href = `/redeem?code=${voucherCode}`;
                                      onClose();
                                    }
                                  }}
                                  className="w-full py-2 px-4 bg-emerald-500 text-white text-[10px] font-black rounded-lg flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all active:scale-95 shadow-sm shadow-emerald-200"
                                >
                                  CLAIM SEKARANG
                                  <Zap className="size-3 fill-current" />
                                </button>
                              </div>
                            )}

                            {notif.type === 'pending' && (
                              <button
                                onClick={() => handleAction(notif)}
                                className="w-full py-2 px-4 bg-[#0f172a] text-white text-[10px] font-black rounded-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95"
                              >
                                BAYAR SEKARANG
                                <ArrowRight className="size-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-4 border-t border-slate-50 bg-slate-50/30">
                <button 
                  onClick={markAllAsRead}
                  className="w-full text-[10px] font-black text-slate-400 hover:text-[#f97316] transition-colors uppercase tracking-widest"
                >
                  Tandai Semua Sudah Dibaca
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
