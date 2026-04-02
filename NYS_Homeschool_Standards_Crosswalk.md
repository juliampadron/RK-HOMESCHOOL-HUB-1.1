# NYS Homeschool Standards Crosswalk

This document maps New York State homeschool subject requirements (Part 100.10) to RK Homeschool Hub offerings and portfolio artifacts.

## Required Subjects (NYS Part 100.10)

### Mathematics

- **Standard Focus:** Problem solving, reasoning, communication, and connections
- **Platform Mapping:** Math games and instructor-led classes
- **Portfolio Evidence:** Game completion logs and uploaded worksheets

### Science

- **Standard Focus:** Inquiry-based learning and the scientific method
- **Platform Mapping:** STEM classes and hands-on projects
- **Portfolio Evidence:** Lab reports and experiment photos

### Social Studies

- **Standard Focus:** Civic participation, geography, and history
- **Platform Mapping:** History classes and cultural arts
- **Portfolio Evidence:** Essays, presentations, and art projects

### English Language Arts

- **Standard Focus:** Reading, writing, speaking, and listening
- **Platform Mapping:** Literature classes and creative writing
- **Portfolio Evidence:** Book reports and creative writing samples

### Visual Arts

- **Standard Focus:** Creating, responding, and connecting
- **Platform Mapping:** Painting, drawing, and sculpture classes
- **Portfolio Evidence:** Photo gallery of artworks

### Music

- **Standard Focus:** Creating, performing, and responding
- **Platform Mapping:** Solfege games and instrument lessons
- **Portfolio Evidence:** Performance videos and composition uploads

### Physical Education

- **Standard Focus:** Movement skills, fitness, and teamwork
- **Platform Mapping:** Athletics classes and dance
- **Portfolio Evidence:** Activity logs and skill demonstrations

## Quarterly Reporting Requirements

### Q1 (October 15)

- Individualized Home Instruction Plan (IHIP)
- List of subjects
- Instructors and materials used

### Q2 and Q3 (January 15, April 15)

- Quarterly reports
- Hours logged per subject
- Progress narrative

### Q4 (June 30)

- Annual assessment (test scores or portfolio evaluation)
- Narrative summary of the year

## Platform Features Supporting Compliance

### Automated Hour Tracking

```sql
select 
  s.first_name,
  c.title as subject,
  sum(extract(epoch from (c.end_time - c.start_time))/3600) as hours
from enrollments e
join classes c on c.id = e.class_id
join students s on s.id = e.student_id
where s.parent_id = auth.uid()
and e.status = 'active'
group by s.id, c.id;
```

### Portfolio Evidence Upload

- Link student work to specific NYS standards
- Tag by subject area
- Date-stamped submissions

### District Export

- PDF report generation
- Pre-populated report fields
- Parent signature block
