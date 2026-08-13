import { classifyMessage } from '../src/services/classifier';

const cases: [string, string, string][] = [
  ['1', '🇸🇱 ТОШКЕНТДАН Баликчи Чинобод Улугноргааа Юрамиз Одам Ва Почталар Бу\'лса Оламиз АВТО Кобилт Багажли Тел: 932503339', 'DRIVER'],
  ['2', 'Toshkentdan Andijonga yuramiz, Cobalt, 3 ta joy bor, odam olamiz', 'DRIVER'],
  ['3', 'Toshkentdan Andijonga borishim kerak, 2 kishimiz, mashina kerak', 'PASSENGER'],
  ['4', 'Andijondan Toshkentga ketamiz, Gentra, 2 ta joy bor', 'DRIVER'],
  ['5', 'Andijondan Toshkentga 2 kishimiz bor, mashina qidiryapmiz', 'PASSENGER'],
  ['6', 'Toshkentdan Andijonga 2 ta odam bor', 'UNKNOWN'],
  ['7', 'Toshkentga boramiz, 3 kishimiz, mashina kerak', 'PASSENGER'],
  ['8', 'Andijondan Toshkentga chiqaman, Damas, 4 ta joy bor, odam olaman', 'DRIVER'],
  ['9', 'Kim bor Toshkentga keta oladigan, 2 kishimiz bor, taksi kerak', 'PASSENGER'],
  ['10', 'Toshkent → Andijon yo\'lovchi olamiz, Cobalt bor', 'DRIVER'],
  ['11', 'Andijondan Toshkentga ketmoqchiman, 1 kishi, joy kerak', 'PASSENGER'],
  ['12', 'Toshkentdan Farg\'onaga yuk tashiyapmiz, Nexia, joylar bor', 'DRIVER'],
  ['13', 'Salom, bugun ob-havo yaxshi ekan', 'UNKNOWN'],
  ['14', 'Toshkentdan Andijonga borishim kerak edi, mashina izlayapman', 'PASSENGER'],
];

let pass = 0;
for (const [id, text, expected] of cases) {
  const r = classifyMessage(text);
  const ok = r.type === expected;
  if (ok) pass++;
  console.log(
    `${ok ? '✅' : '❌'} #${id} kutilgan=${expected} olingan=${r.type} conf=${r.confidence.toFixed(2)} route=${r.route} phone=${r.phone || '-'}`
  );
  console.log(`     sabab: ${r.reason}`);
}
console.log(`\nNatija: ${pass}/${cases.length} to'g'ri`);
