import { AppImages } from '../Constant/AppImages';
import { getAdminSession, getApiAssetUrl } from '../Constant/AdminAuth';

const parseAmount = (value) => Number(String(value || '').replace(/,/g, '')) || 0;

const formatAmount = (value) => parseAmount(value).toLocaleString('en-US');

const formatDate = (value) => {
  if (!value) return '---';
  return new Date(value).toLocaleDateString('ur-PK');
};

export const printFundReceipt = ({ donorInfo = {}, funds = [], collectionGroupId = '' }) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const firstFund = funds[0] || {};
  const session = getAdminSession();
  const madrassaProfile = session?.madrassaProfile || {};
  const madrassaName = madrassaProfile.name || 'دارالعلوم المحمدیہ';
  const profileLogo = madrassaProfile.logoUrl ? getApiAssetUrl(madrassaProfile.logoUrl) : '';
  const receiptLogo = profileLogo || new URL(AppImages.logo, window.location.origin).toString();
  const donorName = donorInfo.name || firstFund.donorName || '---';
  const careOf = donorInfo.careOf || firstFund.careOf || '---';
  const phone = donorInfo.number || firstFund.phone || '---';
  const receiptTrackingId = collectionGroupId || firstFund.collectionGroupId || '---';
  const totalAmount = funds.reduce((sum, fund) => sum + parseAmount(fund.amount), 0);
  const cashTotal = funds.filter((fund) => fund.paymentMode === 'نقد').reduce((sum, fund) => sum + parseAmount(fund.amount), 0);
  const chequeTotal = funds.filter((fund) => fund.paymentMode === 'چیک').reduce((sum, fund) => sum + parseAmount(fund.amount), 0);
  const onlineTotal = funds.filter((fund) => fund.paymentMode === 'آن لائن').reduce((sum, fund) => sum + parseAmount(fund.amount), 0);

  printWindow.document.write(`
    <html dir="rtl">
      <head>
        <title>رسید</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap');
          @page { size: A5; margin: 0; }
          body { margin: 0; -webkit-print-color-adjust: exact; }
          .urdu-font { font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif; }
          .a5-page {
            width: 148mm;
            min-height: 210mm;
            padding: 10mm;
            margin: auto;
            box-sizing: border-box;
            overflow: hidden;
            background: white;
            position: relative;
          }
        </style>
      </head>
      <body class="bg-gray-100">
        <div class="a5-page shadow-lg">
          <img src="${receiptLogo}" alt="مدرسہ لوگو" class="absolute inset-0 m-auto w-64 opacity-5 -rotate-12 object-contain" />

          <div class="relative z-10 flex justify-between text-[8px] text-gray-500 mb-2">
            <span>تاریخ: ${formatDate(firstFund.paymentDate || new Date())}</span>
            <span dir="ltr">ID: ${receiptTrackingId}</span>
          </div>

          <div class="relative z-10 text-center mb-4 border-b-2 border-green-700 pb-3">
            <img src="${receiptLogo}" alt="مدرسہ لوگو" class="w-14 h-14 object-contain mx-auto mb-2" />
            <h1 class="urdu-font text-xl font-bold text-green-800">${madrassaName}</h1>
            <span class="mt-3 urdu-font text-xs bg-green-700 text-white px-3 py-3 rounded-full inline-block mt-1">الیکٹرانک رسیدِ عطیات</span>
          </div>

          <div class="relative z-10 grid grid-cols-2 gap-2 mb-3">
            <div class="border border-green-200 bg-green-50 p-2 rounded-lg flex flex-row items-center">
              <p class="urdu-font text-[10px] text-green-700">نام دہندہ:</p>
              <p class="urdu-font text-xs font-bold mr-4">${donorName}</p>
            </div>
            <div class="border border-green-200 bg-green-50 p-2 rounded-lg flex flex-row items-center">
              <p class="urdu-font text-[10px] text-green-700">رابطہ نمبر:</p>
              <p class="text-xs font-bold mr-4" dir="ltr">${phone}</p>
            </div>
            <div class="border border-green-200 bg-green-50 p-2 rounded-lg flex flex-row items-center">
              <p class="urdu-font text-[10px] text-green-700">ولدیت:</p>
              <p class="urdu-font text-xs font-bold mr-4">${careOf}</p>
            </div>
            <div class="border border-green-200 bg-green-50 p-2 rounded-lg flex flex-row items-center">
              <p class="urdu-font text-[10px] text-green-700">ٹریکنگ نمبر:</p>
              <p class="text-xs font-bold mr-4" dir="ltr">${receiptTrackingId}</p>
            </div>
          </div>

          <div class="relative z-10">
            <table class="w-full text-right border-collapse">
              <thead>
                <tr class="bg-green-700 text-white urdu-font text-[10px]">
                  <th class="p-1 border border-green-800 text-center">شمار</th>
                  <th class="p-1 border border-green-800">نوعیت</th>
                  <th class="p-1 border border-green-800">مقصد</th>
                  <th class="p-1 border border-green-800 text-center">طریقہ</th>
                  <th class="p-1 border border-green-800 text-center">رقم</th>
                </tr>
              </thead>
              <tbody class="urdu-font text-[10px]">
                ${funds.map((fund, index) => `
                  <tr class="border-b border-gray-200">
                    <td class="p-1 text-center border-x">${index + 1}</td>
                    <td class="p-1 border-x">${fund.donationType || '---'} - ${fund.donationSubType || '---'}</td>
                    <td class="p-1 border-x">${fund.purpose || fund.details || '---'}</td>
                    <td class="p-1 text-center border-x">${fund.paymentMode || '---'}</td>
                    <td class="p-1 text-center font-bold border-x">${formatAmount(fund.amount)}/-</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="relative z-10 mt-4 border-t border-dashed border-gray-400 pt-3">
            <table class="w-full text-[10px] border border-gray-300">
              <tr class="bg-gray-50 border-b">
                <td class="p-1 border-l urdu-font text-center font-bold">نقد</td>
                <td class="p-1 border-l urdu-font text-center font-bold">چیک</td>
                <td class="p-1 border-l urdu-font text-center font-bold">آن لائن</td>
                <td class="p-1 urdu-font text-center font-bold bg-green-50 text-green-800">میزان کل</td>
              </tr>
              <tr>
                <td class="p-1 border-l text-center">${formatAmount(cashTotal)}/-</td>
                <td class="p-1 border-l text-center">${formatAmount(chequeTotal)}/-</td>
                <td class="p-1 border-l text-center">${formatAmount(onlineTotal)}/-</td>
                <td class="p-1 text-center font-extrabold text-sm bg-green-100 text-green-900">${formatAmount(totalAmount)}/-</td>
              </tr>
            </table>
          </div>

          <div class="relative z-10 mt-8 flex justify-between urdu-font text-[10px]">
            <span>دستخط دہندہ: __________________</span>
            <span>دستخط وصول کنندہ: __________________</span>
          </div>
        </div>

        <script>
          window.onload = () => {
            window.print();
            window.onafterprint = () => window.close();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
