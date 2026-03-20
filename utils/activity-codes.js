// Activity codes available in SAP Synerion
// Updated to match actual dropdown options
const ACTIVITY_CODES = [
  { code: '2', hebrew: 'חופשה', english: 'Vacation' },
  { code: '3', hebrew: 'מחלה מאושרת', english: 'Approved sick leave' },
  { code: '4', hebrew: 'מחלת ילד', english: 'Child sick leave' },
  { code: '5', hebrew: 'מחלת הורה', english: 'Parent sick leave' },
  { code: '6', hebrew: 'מחלת בן זוג', english: 'Spouse sick leave' },
  { code: '8', hebrew: 'מחלה בהצהרה', english: 'Sick leave by declaration' },
  { code: '9', hebrew: 'השתלמות', english: 'Professional development' },
  { code: '17', hebrew: 'שעות הריון', english: 'Pregnancy hours' },
  { code: '23', hebrew: 'חו"ל', english: 'Abroad' },
  { code: '24', hebrew: 'מילואים באישור', english: 'Approved reserve duty' },
  { code: '27', hebrew: 'עבודה מרחוק', english: 'Remote Work', isDefault: true },
  { code: '30', hebrew: 'מילואים-לספק אישור', english: 'Reserve duty - pending approval' },
  { code: '32', hebrew: 'חופש 50%', english: '50% vacation' },
  { code: '35', hebrew: 'יום גיבוש', english: 'Team building day' },
  { code: '36', hebrew: 'עבודה באתר הלקוח', english: 'Work at client site' },
  { code: '55', hebrew: 'בדיקות סקר', english: 'Survey tests' },
  { code: '64', hebrew: 'ערב חג בחירה', english: 'Holiday eve by choice' },
  { code: '65', hebrew: 'עבודה במשרד תל אביב', english: 'Work at Tel Aviv office' },
  { code: '66', hebrew: 'עבודה במשרד רעננה', english: 'Work at Ra\'anana office' },
  { code: '67', hebrew: 'שעות סיוע לילד', english: 'Child assistance hours' },
  { code: '68', hebrew: '3010 במקביל לעבודה ברעננה', english: '3010 parallel to Ra\'anana' },
  { code: '69', hebrew: '3010 במקביל לעבודה בת"א', english: '3010 parallel to Tel Aviv' },
  { code: '70', hebrew: '3010 במקביל לעבודה מרחוק', english: '3010 parallel to remote' },
  { code: '71', hebrew: 'צו 8 במקביל לעבודה ברעננה', english: 'Tzav 8 parallel to Ra\'anana' },
  { code: '72', hebrew: 'צו 8 במקביל לעבודה בת"א', english: 'Tzav 8 parallel to Tel Aviv' },
  { code: '73', hebrew: 'צו 8 במקביל לעבודה מרחוק', english: 'Tzav 8 parallel to remote' }
];

const DEFAULT_ACTIVITY_CODE = '27'; // Remote Work
const DEFAULT_ACTIVITY_TEXT = 'עבודה מרחוק'; // Remote Work (Hebrew text)

// Export for use in both content script and popup
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ACTIVITY_CODES, DEFAULT_ACTIVITY_CODE, DEFAULT_ACTIVITY_TEXT };
}
