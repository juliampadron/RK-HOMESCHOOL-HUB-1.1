import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Renaissance Kids Color Palette
const colors = {
  rkOrange: '#F05A22',
  rkBlue: '#2B59C3',
  rkYellow: '#FBC440',
  rkGreen: '#2F6B65',
  background: '#fdfbf7',
  ink: '#1c1c1c',
  gray: '#666666',
  lightGray: '#e0e0e0',
};

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    borderBottom: `4px solid ${colors.rkYellow}`,
    paddingBottom: 15,
    marginBottom: 20,
  },
  logoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.rkGreen,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.rkGreen,
    textAlign: 'right',
  },
  reportInfo: {
    fontSize: 9,
    color: colors.gray,
    textAlign: 'right',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.ink,
    marginTop: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  divider: {
    borderBottom: `1px solid ${colors.lightGray}`,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontWeight: 'bold',
    width: 120,
  },
  value: {
    flex: 1,
  },
  subjectBlock: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    borderLeft: `4px solid ${colors.rkOrange}`,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  subjectTitle: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  hours: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.rkOrange,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginLeft: 10,
    marginBottom: 4,
  },
  bullet: {
    width: 15,
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
  },
  standardItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 10,
  },
  checkmark: {
    width: 20,
    color: colors.rkGreen,
    fontWeight: 'bold',
  },
  standardCode: {
    width: 100,
    fontWeight: 'bold',
    fontSize: 9,
  },
  standardDesc: {
    flex: 1,
    fontSize: 9,
  },
  portfolioItem: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  portfolioTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  portfolioDetail: {
    fontSize: 8,
    color: colors.gray,
    marginBottom: 2,
  },
  feedbackBlock: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  instructorName: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 9,
    fontStyle: 'italic',
    lineHeight: 1.4,
  },
  signatureSection: {
    marginTop: 20,
    padding: 15,
    border: `1px solid ${colors.lightGray}`,
    borderRadius: 4,
  },
  signatureLine: {
    borderBottom: `1px solid ${colors.ink}`,
    marginTop: 20,
    marginBottom: 5,
    width: '45%',
  },
  signatureLabel: {
    fontSize: 8,
    color: colors.gray,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: colors.gray,
    borderTop: `1px solid ${colors.lightGray}`,
    paddingTop: 10,
  },
  certificationText: {
    fontSize: 9,
    lineHeight: 1.4,
    marginBottom: 15,
  },
});

interface QuarterlyReportData {
  student: {
    firstName: string;
    lastInitial: string;
    grade: string;
    parentGuardian: string;
    district: string;
  };
  reportPeriod: {
    quarter: string;
    year: number;
    startDate: string;
    endDate: string;
    generatedDate: string;
  };
  summary: {
    totalHours: number;
    classesEnrolled: number;
    instructorsCount: number;
  };
  subjects: Array<{
    name: string;
    hours: number;
    classes: Array<{
      title: string;
      instructor: string;
    }>;
    games?: string[];
    portfolioCount?: number;
  }>;
  standards: Array<{
    subject: string;
    items: Array<{
      code: string;
      description: string;
    }>;
  }>;
  portfolio: Array<{
    title: string;
    submittedDate: string;
    standard: string;
    type: string;
  }>;
  instructorFeedback: Array<{
    instructor: string;
    subject: string;
    feedback: string;
  }>;
}

export const QuarterlyReportPDF: React.FC<{ data: QuarterlyReportData }> = ({
  data,
}) => {
  return (
    <Document>
      {/* Page 1: Header & Student Info */}
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.rkGreen }}>
              Renaissance Kids
            </Text>
            <View>
              <Text style={styles.title}>QUARTERLY HOMESCHOOL</Text>
              <Text style={styles.subtitle}>PROGRESS REPORT</Text>
            </View>
          </View>
          <Text style={styles.reportInfo}>
            Report Period: {data.reportPeriod.quarter} {data.reportPeriod.year} (
            {data.reportPeriod.startDate} - {data.reportPeriod.endDate})
          </Text>
          <Text style={styles.reportInfo}>
            Generated: {data.reportPeriod.generatedDate}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Student Information</Text>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>
            {data.student.firstName} {data.student.lastInitial}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Grade:</Text>
          <Text style={styles.value}>{data.student.grade}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Parent/Guardian:</Text>
          <Text style={styles.value}>{data.student.parentGuardian}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>District:</Text>
          <Text style={styles.value}>{data.student.district}</Text>
        </View>

        <Text style={styles.sectionTitle}>Instruction Summary</Text>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.label}>Total Hours This Quarter:</Text>
          <Text style={styles.value}>{data.summary.totalHours}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Classes Enrolled:</Text>
          <Text style={styles.value}>{data.summary.classesEnrolled}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Instructors:</Text>
          <Text style={styles.value}>{data.summary.instructorsCount}</Text>
        </View>
      </Page>

      {/* Page 2: Subject Breakdown */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.sectionTitle}>
          Subject Area Hours (NYS Required Subjects)
        </Text>
        <View style={styles.divider} />

        {data.subjects.map((subject, index) => (
          <View key={index} style={styles.subjectBlock}>
            <View style={styles.subjectHeader}>
              <Text style={styles.subjectTitle}>{subject.name}</Text>
              <Text style={styles.hours}>{subject.hours} hours</Text>
            </View>
            {subject.classes.map((cls, clsIndex) => (
              <View key={clsIndex} style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>
                  {cls.title} ({cls.instructor})
                </Text>
              </View>
            ))}
            {subject.games && subject.games.length > 0 && (
              <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>
                  Games: {subject.games.join(', ')}
                </Text>
              </View>
            )}
            {subject.portfolioCount && subject.portfolioCount > 0 && (
              <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>
                  Portfolio: {subject.portfolioCount} items submitted
                </Text>
              </View>
            )}
          </View>
        ))}
      </Page>

      {/* Page 3: NYS Standards Alignment */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.sectionTitle}>
          NYS Learning Standards Met This Quarter
        </Text>
        <View style={styles.divider} />

        {data.standards.map((standardGroup, index) => (
          <View key={index} style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: 'bold',
                marginBottom: 8,
                color: colors.rkGreen,
              }}
            >
              {standardGroup.subject}
            </Text>
            {standardGroup.items.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.standardItem}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={styles.standardCode}>{item.code}</Text>
                <Text style={styles.standardDesc}>{item.description}</Text>
              </View>
            ))}
          </View>
        ))}
      </Page>

      {/* Page 4: Portfolio Evidence */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.sectionTitle}>Portfolio Submissions</Text>
        <View style={styles.divider} />

        {data.portfolio.map((item, index) => (
          <View key={index} style={styles.portfolioItem}>
            <Text style={styles.portfolioTitle}>
              {item.type}: {item.title}
            </Text>
            <Text style={styles.portfolioDetail}>
              Submitted: {item.submittedDate}
            </Text>
            <Text style={styles.portfolioDetail}>Standard: {item.standard}</Text>
          </View>
        ))}

        {data.portfolio.length > 0 && (
          <Text
            style={{
              marginTop: 15,
              fontSize: 9,
              color: colors.gray,
              fontStyle: 'italic',
            }}
          >
            View full portfolio at: renkids.org/portfolio
          </Text>
        )}
      </Page>

      {/* Page 5: Instructor Notes & Signatures */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.sectionTitle}>Instructor Feedback</Text>
        <View style={styles.divider} />

        {data.instructorFeedback.map((feedback, index) => (
          <View key={index} style={styles.feedbackBlock}>
            <Text style={styles.instructorName}>
              {feedback.instructor} ({feedback.subject}):
            </Text>
            <Text style={styles.feedbackText}>"{feedback.feedback}"</Text>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>
          Parent/Guardian Certification
        </Text>
        <View style={styles.divider} />

        <View style={styles.signatureSection}>
          <Text style={styles.certificationText}>
            I certify that the information in this report accurately reflects
            the educational instruction provided this quarter.
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: '45%' }}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Signature</Text>
            </View>
            <View style={{ width: '25%' }}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Date</Text>
            </View>
          </View>

          <View style={{ marginTop: 15, width: '45%' }}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>
              Print Name: {data.student.parentGuardian}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Renaissance Kids, Inc.</Text>
          <Text>1343 Route 44, Pleasant Valley, NY 12569</Text>
          <Text>(845) 452-4225 | www.renkids.org</Text>
        </View>
      </Page>
    </Document>
  );
};
