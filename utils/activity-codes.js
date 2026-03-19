// Activity codes available in SAP Synerion
const ACTIVITY_CODES = [
  { code: '1', hebrew: 'רגיל', english: 'Regular' },
  { code: '2', hebrew: 'חופשה', english: 'Vacation' },
  { code: '3', hebrew: 'חופשת לידה', english: 'Maternity leave' },
  { code: '4', hebrew: 'חופשת אבלות', english: 'Bereavement leave' },
  { code: '5', hebrew: 'מילואים', english: 'Military reserve' },
  { code: '6', hebrew: 'יום עיון', english: 'Training day' },
  { code: '7', hebrew: 'היעדרות לא מאושרת', english: 'Unauthorized absence' },
  { code: '8', hebrew: 'חופש ללא תשלום', english: 'Unpaid leave' },
  { code: '9', hebrew: 'היעדרות מאושרת', english: 'Authorized absence' },
  { code: '10', hebrew: 'חופש שנתי', english: 'Annual leave' },
  { code: '11', hebrew: 'מחלה', english: 'Sick leave' },
  { code: '12', hebrew: 'תרומת דם', english: 'Blood donation' },
  { code: '13', hebrew: 'אירוע משפחתי', english: 'Family event' },
  { code: '14', hebrew: 'השתלמות', english: 'Professional development' },
  { code: '15', hebrew: 'נסיעה עסקית', english: 'Business travel' },
  { code: '17', hebrew: 'עבודה בשטח', english: 'Field work' },
  { code: '18', hebrew: 'פגישת לקוח', english: 'Client meeting' },
  { code: '19', hebrew: 'אחר', english: 'Other' },
  { code: '20', hebrew: 'עבודה היברידית', english: 'Hybrid work' },
  { code: '21', hebrew: 'ישיבה פנימית', english: 'Internal meeting' },
  { code: '22', hebrew: 'כנס', english: 'Conference' },
  { code: '23', hebrew: 'לימוד עצמי', english: 'Self-study' },
  { code: '24', hebrew: 'תמיכה טכנית', english: 'Technical support' },
  { code: '25', hebrew: 'ביקורת', english: 'Audit' },
  { code: '26', hebrew: 'פרויקט מיוחד', english: 'Special project' },
  { code: '27', hebrew: 'עבודה מרחוק', english: 'Remote Work', isDefault: true },
  { code: '28', hebrew: 'חופשה מאושרת', english: 'Approved vacation' },
  { code: '29', hebrew: 'עבודה מהבית', english: 'Work from home' }
];

const DEFAULT_ACTIVITY_CODE = '27'; // Remote Work
const DEFAULT_ACTIVITY_TEXT = 'עבודה מרחוק'; // Remote Work (Hebrew text)

// Export for use in both content script and popup
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ACTIVITY_CODES, DEFAULT_ACTIVITY_CODE, DEFAULT_ACTIVITY_TEXT };
}
