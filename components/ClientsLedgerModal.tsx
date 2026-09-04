import React, { useState } from 'react';
import { Operation } from '../types';
import { playKeypadBeep, playUndoSound } from '../services/soundEffects';

interface ClientsLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  operations: Operation[];
  onTogglePaidStatus: (opId: string) => void;
  onMarkAllClientPaid?: (clientNameOrPhone: string) => void;
}

interface ClientSummary {
  name: string;
  phone?: string;
  operations: Operation[];
  totalCoursesCount: number;
  unpaidCount: number;
  unpaidTotalAmount: number;
  paidTotalAmount: number;
  lastTripDate?: string;
}

export const ClientsLedgerModal: React.FC<ClientsLedgerModalProps> = ({
  isOpen,
  onClose,
  operations,
  onTogglePaidStatus,
  onMarkAllClientPaid,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'unpaidOnly'>('unpaidOnly');

  if (!isOpen) return null;

  // Filter earnings operations only
  const earningsOps = operations.filter((op) => op.type === 'earnings');

  // Group by normalized client key (name or phone)
  const clientMap = new Map<string, ClientSummary>();

  for (const op of earningsOps) {
    const rawName = op.clientName?.trim() || '';
    const rawPhone = op.clientPhone?.trim() || '';
    const key = rawName || rawPhone || 'زبون عام / غير مسجل';

    if (!clientMap.has(key)) {
      clientMap.set(key, {
        name: rawName || (rawPhone ? `صاحب الرقم: ${rawPhone}` : 'زبون عام / غير محدد'),
        phone: rawPhone || undefined,
        operations: [],
        totalCoursesCount: 0,
        unpaidCount: 0,
        unpaidTotalAmount: 0,
        paidTotalAmount: 0,
        lastTripDate: op.timestamp,
      });
    }

    const client = clientMap.get(key)!;
    client.operations.push(op);
    client.totalCoursesCount += 1;
    if (op.isPaid === false) {
      client.unpaidCount += 1;
      client.unpaidTotalAmount += op.amount || 0;
    } else {
      client.paidTotalAmount += op.amount || 0;
    }
  }

  const clientList = Array.from(clientMap.values()).sort((a, b) => {
    // Show clients with unpaid debts first
    if (b.unpaidTotalAmount !== a.unpaidTotalAmount) {
      return b.unpaidTotalAmount - a.unpaidTotalAmount;
    }
    return b.totalCoursesCount - a.totalCoursesCount;
  });

  const filteredClients = clientList.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm));
    if (filterType === 'unpaidOnly') {
      return matchesSearch && c.unpaidCount > 0;
    }
    return matchesSearch;
  });

  const totalUnpaidAllClients = clientList.reduce((acc, c) => acc + c.unpaidTotalAmount, 0);
  const totalUnpaidCountAllClients = clientList.reduce((acc, c) => acc + c.unpaidCount, 0);

  const activeClientObj = selectedClient ? clientMap.get(selectedClient) : null;

  const handleSendWhatsappReminder = (client: ClientSummary) => {
    if (!client.phone) return;
    const cleanPhone = client.phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `السلام عليكم ورحمة الله أخي الكريم ${client.name !== client.phone ? client.name : ''} 🌹\nنذكركم بخصوص حساب رحلة توصيل متبقية بقيمة ${client.unpaidTotalAmount.toLocaleString()} أوقية.\nشكراً جزيلاً لتعاملكم الراقي!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handlePhoneCall = (phone?: string) => {
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[95] backdrop-blur-sm p-3 sm:p-6 overflow-y-auto flex items-center justify-center font-['Cairo',sans-serif] select-none"
      dir="rtl"
    >
      <div
        className="bg-[#F9FAFB] rounded-[2.5rem] w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl border-4 border-indigo-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white p-5 sm:p-6 rounded-b-[2rem] shadow-md shrink-0">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">👥</span>
                <h2 className="text-xl sm:text-2xl font-black">دفتر الزبائن والمحلات الدائنة</h2>
              </div>
              <p className="text-xs text-blue-200 font-bold mt-1">
                تتبع ديون الرحلات وتذكير أصحابها بسهولة عبر الهاتف أو الواتساب
              </p>
            </div>
            <button
              onClick={() => {
                playUndoSound();
                onClose();
              }}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-sm active:scale-95 transition-all"
            >
              إغلاق ✕
            </button>
          </div>

          {/* Quick Summary Bar */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="bg-white/10 border border-white/15 rounded-2xl p-2.5 text-center">
              <span className="text-[10px] text-blue-200 font-bold block">إجمالي المبالغ المعلقة</span>
              <span className="text-base sm:text-lg font-black text-amber-300 font-mono">
                {totalUnpaidAllClients.toLocaleString()} <span className="text-xs font-sans">أوقية</span>
              </span>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-2xl p-2.5 text-center">
              <span className="text-[10px] text-blue-200 font-bold block">رحلات بانتظار التحصيل</span>
              <span className="text-base sm:text-lg font-black text-white">
                {totalUnpaidCountAllClients} <span className="text-xs font-bold text-blue-200">رحلة</span>
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 bg-white border-b border-slate-200 space-y-3 shrink-0">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث بالاسم أو رقم الهاتف..."
              className="w-full text-xs sm:text-sm font-bold p-3 pr-9 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white text-right transition-all"
            />
            <span className="absolute right-3 top-3 text-slate-400 text-sm">🔍</span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-3 top-3 text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-0.5 rounded-lg font-bold"
              >
                مسح ✕
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                playKeypadBeep('✓');
                setFilterType('unpaidOnly');
              }}
              className={`flex-1 py-2 rounded-xl font-black text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                filterType === 'unpaidOnly'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>⏳</span>
              <span>المتبقي عليهم دفعات ({clientList.filter((c) => c.unpaidCount > 0).length})</span>
            </button>
            <button
              onClick={() => {
                playKeypadBeep('✓');
                setFilterType('all');
              }}
              className={`flex-1 py-2 rounded-xl font-black text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>📋</span>
              <span>جميع الزبائن ({clientList.length})</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-3 flex-grow">
          {filteredClients.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 p-6">
              <span className="text-4xl block mb-2">✨</span>
              <p className="font-black text-slate-700 text-sm">
                {filterType === 'unpaidOnly'
                  ? 'رائع جداً! لا توجد أي مبالغ معلقة على الزبائن حالياً.'
                  : 'لا يوجد أي زبون مطابق للبحث.'}
              </p>
              <p className="text-xs text-slate-400 font-bold mt-1">
                عند تسجيل الرحلة، اكتب اسم الزبون أو رقمه لتظهر ديونه وسجله هنا مباشرة.
              </p>
            </div>
          ) : (
            filteredClients.map((client) => {
              const isExpanded = selectedClient === (client.name || client.phone);
              const key = client.name || client.phone || 'unknown';

              return (
                <div
                  key={key}
                  className={`bg-white rounded-3xl border-2 transition-all overflow-hidden ${
                    client.unpaidCount > 0
                      ? 'border-amber-300 hover:border-amber-400 shadow-xs'
                      : 'border-slate-200 hover:border-indigo-200'
                  }`}
                >
                  {/* Client Card Header */}
                  <div
                    onClick={() => setSelectedClient(isExpanded ? null : key)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 ${
                          client.unpaidCount > 0
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        {client.unpaidCount > 0 ? '⏳' : '✅'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-slate-900 text-sm sm:text-base">
                            {client.name}
                          </h4>
                          {client.phone && (
                            <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200" dir="ltr">
                              📞 {client.phone}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-bold">
                          <span>{client.totalCoursesCount} رحلات مسجلة</span>
                          {client.unpaidCount > 0 ? (
                            <span className="text-amber-700 font-black">
                              • ({client.unpaidCount} غير مسددة)
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-black">• جميعها مسددة ✅</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      {client.unpaidCount > 0 ? (
                        <div className="text-right">
                          <span className="text-[10px] text-amber-800 font-black block">المتبقي:</span>
                          <span className="text-base sm:text-lg font-black text-amber-600 font-mono">
                            {client.unpaidTotalAmount.toLocaleString()} <span className="text-[10px] font-sans">أوقية</span>
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                          خالص ✓
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions & Quick Communication Bar */}
                  <div className="px-4 pb-3 pt-1 flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/50 flex-wrap">
                    <div className="flex items-center gap-2">
                      {client.phone && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePhoneCall(client.phone);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-800 font-black text-xs flex items-center gap-1 transition-all active:scale-95"
                            title="اتصال هاتف مباشر"
                          >
                            <span>📞</span>
                            <span>اتصال</span>
                          </button>
                          {client.unpaidCount > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendWhatsappReminder(client);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1 transition-all active:scale-95 shadow-2xs"
                              title="إرسال تذكير عبر واتساب"
                            >
                              <span>💬</span>
                              <span>تذكير واتساب</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {client.unpaidCount > 0 && onMarkAllClientPaid && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playKeypadBeep('✓');
                            onMarkAllClientPaid(client.name || client.phone || '');
                          }}
                          className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs flex items-center gap-1 transition-all active:scale-95 shadow-2xs"
                          title="تسديد جميع الرحلات المعلقة لهذا الزبون"
                        >
                          <span>تسديد الكل</span>
                          <span>💵</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedClient(isExpanded ? null : key)}
                        className="text-xs font-bold text-indigo-700 hover:underline"
                      >
                        {isExpanded ? 'إخفاء التفاصيل ▲' : 'عرض التفاصيل ▼'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Trip History */}
                  {isExpanded && (
                    <div className="p-4 bg-slate-100/70 border-t border-slate-200 space-y-2">
                      <p className="text-xs font-black text-slate-700 mb-2 flex items-center justify-between">
                        <span>سجل رحلات {client.name}:</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          اضغط على زر التسديد لأي رحلة عند الاستلام
                        </span>
                      </p>
                      {client.operations.map((op) => {
                        const isUnpaid = op.isPaid === false;
                        return (
                          <div
                            key={op.id}
                            className={`p-3 rounded-2xl bg-white border flex items-center justify-between gap-2 shadow-2xs ${
                              isUnpaid ? 'border-amber-300' : 'border-slate-200'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-xs text-slate-800">
                                  {op.courseTitle || op.label}
                                </span>
                                {isUnpaid ? (
                                  <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-300">
                                    غير مدفوع ⏳
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-300">
                                    مدفوع ✅
                                  </span>
                                )}
                              </div>
                              {(op.fromLocation || op.toLocation) && (
                                <p className="text-[11px] text-slate-500 font-bold">
                                  📍 {op.fromLocation || 'الموقع'} ➔ {op.toLocation || 'الوجهة'}
                                </p>
                              )}
                              <p className="text-[10px] text-slate-400 font-bold">{op.timestamp}</p>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <span className="font-mono font-black text-sm text-slate-800">
                                {op.amount.toLocaleString()} أوقية
                              </span>
                              <button
                                type="button"
                                onClick={() => onTogglePaidStatus(op.id)}
                                className={`px-2.5 py-1 rounded-xl text-xs font-black border transition-all active:scale-95 ${
                                  isUnpaid
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-2xs'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                }`}
                              >
                                {isUnpaid ? 'دفع 💵' : 'مسدد ✓'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
