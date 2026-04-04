import { useState, useEffect } from 'react';
import {
   FolderOpen,
   Shield,
   Settings,
   Globe,
   Plus,
   Link,
   Calendar as CalendarIcon,
   CheckSquare,
   BookOpen,
   Trash2,
} from 'lucide-react';
import clsx from 'clsx';
import { persistCoursesState } from '../../lib/subjectHealth';

interface Assignment {
   id: string;
   text: string;
   completed: boolean;
}

interface SyllabusChapter {
   id: string;
   name: string;
   completed: boolean;
}

interface Course {
   id: string;
   code: string;
   name: string;
   colorClass: string;
   icon: keyof typeof ICON_MAP;
   assignments: Assignment[];
   chapters: SyllabusChapter[];
}

const ICON_MAP = {
   FolderOpen,
   Shield,
   Settings,
   Globe,
   Link,
};

const defaultSyllabusByCode: Record<string, SyllabusChapter[]> = {
   OSY: [
      { id: 'osy-ch-1', name: 'Chapter 1: Intro to Operating Systems', completed: false },
      { id: 'osy-ch-2', name: 'Chapter 2: Process Management', completed: false },
   ],
   CSY: [
      { id: 'csy-ch-1', name: 'Chapter 1: Security Fundamentals', completed: false },
      { id: 'csy-ch-2', name: 'Chapter 2: Network Threats', completed: false },
   ],
   IOT: [
      { id: 'iot-ch-1', name: 'Chapter 1: IoT Architecture', completed: false },
      { id: 'iot-ch-2', name: 'Chapter 2: Sensor Integration', completed: false },
   ],
   NWA: [
      { id: 'nwa-ch-1', name: 'Chapter 1: Routing Basics', completed: false },
      { id: 'nwa-ch-2', name: 'Chapter 2: Switching Concepts', completed: false },
   ],
   PRP: [
      { id: 'prp-ch-1', name: 'Chapter 1: Python Best Practices', completed: false },
      { id: 'prp-ch-2', name: 'Chapter 2: Testing Workflows', completed: false },
   ],
};

const DEFAULT_COURSES: Course[] = [
   {
      id: '1',
      code: 'OSY',
      name: 'Operating Systems',
      colorClass: 'bg-[#2A4B7C]/20 text-[#2A4B7C]',
      icon: 'FolderOpen',
      assignments: [
         { id: 'a1', text: 'Sign up for group project topic', completed: false },
         { id: 'a2', text: 'Zoom meeting with group', completed: false },
         { id: 'a3', text: 'Read/annotate articles 1 and 2', completed: true },
         { id: 'a4', text: 'To-do', completed: true },
      ],
      chapters: defaultSyllabusByCode.OSY,
   },
   {
      id: '2',
      code: 'CSY',
      name: 'Computer Security',
      colorClass: 'bg-[#7C6A2A]/20 text-[#7C6A2A]',
      icon: 'Shield',
      assignments: [
         { id: 'b1', text: 'Purchase lab kit', completed: false },
         { id: 'b2', text: 'Prep for surgical lab skills', completed: false },
         { id: 'b3', text: 'Do pre-lab learning activities', completed: false },
      ],
      chapters: defaultSyllabusByCode.CSY,
   },
   {
      id: '3',
      code: 'IOT',
      name: 'Internet of Things',
      colorClass: 'bg-[#7C3A3A]/20 text-[#7C3A3A]',
      icon: 'Settings',
      assignments: [
         { id: 'c1', text: 'E-mail professor about paper #1', completed: false },
         { id: 'c2', text: 'To-do', completed: false },
      ],
      chapters: defaultSyllabusByCode.IOT,
   },
   {
      id: '4',
      code: 'NWA',
      name: 'Network Admin',
      colorClass: 'bg-[#2A7C3A]/20 text-[#2A7C3A]',
      icon: 'Globe',
      assignments: [
         { id: 'd1', text: 'To-do', completed: false },
         { id: 'd2', text: 'To-do', completed: false },
      ],
      chapters: defaultSyllabusByCode.NWA,
   },
   {
      id: '5',
      code: 'PRP',
      name: 'Programming Practices',
      colorClass: 'bg-[#5B3A7C]/20 text-[#5B3A7C]',
      icon: 'Link',
      assignments: [
         { id: 'e1', text: 'Get Latest python version', completed: true },
         { id: 'e2', text: 'To-do', completed: false },
      ],
      chapters: defaultSyllabusByCode.PRP,
   },
];

const isIconKey = (value: unknown): value is keyof typeof ICON_MAP => typeof value === 'string' && value in ICON_MAP;

const normalizeAssignments = (value: unknown, courseId: string): Assignment[] => {
   if (!Array.isArray(value)) return [];
   return value
      .filter((item) => item && typeof item === 'object')
      .map((item, idx) => {
         const assignment = item as Record<string, unknown>;
         return {
            id: typeof assignment.id === 'string' && assignment.id.trim() ? assignment.id : `${courseId}-task-${idx + 1}`,
            text: typeof assignment.text === 'string' && assignment.text.trim() ? assignment.text : 'To-do',
            completed: Boolean(assignment.completed),
         };
      });
};

const normalizeChapters = (value: unknown, courseId: string, fallbackCode: string): SyllabusChapter[] => {
   if (Array.isArray(value) && value.length > 0) {
      return value
         .filter((item) => item && typeof item === 'object')
         .map((item, idx) => {
            const chapter = item as Record<string, unknown>;
            return {
               id: typeof chapter.id === 'string' && chapter.id.trim() ? chapter.id : `${courseId}-chapter-${idx + 1}`,
               name: typeof chapter.name === 'string' && chapter.name.trim() ? chapter.name : `Chapter ${idx + 1}`,
               completed: Boolean(chapter.completed),
            };
         });
   }

   const fallback = defaultSyllabusByCode[fallbackCode] || [];
   return fallback.map((chapter, idx) => ({ ...chapter, id: `${courseId}-chapter-${idx + 1}` }));
};

const normalizeCourse = (value: unknown, idx: number): Course => {
   const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
   const id = typeof source.id === 'string' && source.id.trim() ? source.id : `course-${idx + 1}`;
   const code = typeof source.code === 'string' && source.code.trim() ? source.code.trim().toUpperCase() : `SUB${idx + 1}`;

   return {
      id,
      code,
      name: typeof source.name === 'string' && source.name.trim() ? source.name.trim() : `Subject ${idx + 1}`,
      colorClass: typeof source.colorClass === 'string' && source.colorClass.trim()
         ? source.colorClass
         : 'bg-black/5 text-text-primary',
      icon: isIconKey(source.icon) ? source.icon : 'FolderOpen',
      assignments: normalizeAssignments(source.assignments, id),
      chapters: normalizeChapters(source.chapters, id, code),
   };
};

export default function CoursesView() {
   const [courses, setCourses] = useState<Course[]>([]);

   const saveState = (newState: Course[]) => {
      setCourses(newState);
      persistCoursesState(newState);
   };

   useEffect(() => {
      const saved = localStorage.getItem('college_courses_state');
      if (saved) {
         try {
            const parsed = JSON.parse(saved);
            const next = Array.isArray(parsed) ? parsed.map(normalizeCourse) : DEFAULT_COURSES;
            saveState(next);
         } catch {
            saveState(DEFAULT_COURSES);
         }
         return;
      }

      saveState(DEFAULT_COURSES);
   }, []);

   const toggleTask = (courseId: string, taskId: string) => {
      const next = courses.map((course) => {
         if (course.id !== courseId) return course;
         return {
            ...course,
            assignments: course.assignments.map((assignment) =>
               assignment.id === taskId ? { ...assignment, completed: !assignment.completed } : assignment
            ),
         };
      });
      saveState(next);
   };

   const addTask = (courseId: string) => {
      const next = courses.map((course) => {
         if (course.id !== courseId) return course;
         return {
            ...course,
            assignments: [...course.assignments, { id: crypto.randomUUID(), text: 'New assignment / note', completed: false }],
         };
      });
      saveState(next);
   };

   const updateTaskText = (courseId: string, taskId: string, txt: string) => {
      setCourses((prev) =>
         prev.map((course) => {
            if (course.id !== courseId) return course;
            return {
               ...course,
               assignments: course.assignments.map((assignment) =>
                  assignment.id === taskId ? { ...assignment, text: txt } : assignment
               ),
            };
         })
      );
   };

   const commitTaskText = () => {
      saveState(courses);
   };

   const deleteTask = (courseId: string, taskId: string) => {
      const next = courses.map((course) => {
         if (course.id !== courseId) return course;
         return { ...course, assignments: course.assignments.filter((assignment) => assignment.id !== taskId) };
      });
      saveState(next);
   };

   const toggleChapter = (courseId: string, chapterId: string) => {
      const next = courses.map((course) => {
         if (course.id !== courseId) return course;
         return {
            ...course,
            chapters: course.chapters.map((chapter) =>
               chapter.id === chapterId ? { ...chapter, completed: !chapter.completed } : chapter
            ),
         };
      });
      saveState(next);
   };

   const addChapter = (courseId: string) => {
      const next = courses.map((course) => {
         if (course.id !== courseId) return course;
         const nextIndex = course.chapters.length + 1;
         return {
            ...course,
            chapters: [...course.chapters, { id: crypto.randomUUID(), name: `Chapter ${nextIndex}`, completed: false }],
         };
      });
      saveState(next);
   };

   const updateChapterText = (courseId: string, chapterId: string, name: string) => {
      setCourses((prev) =>
         prev.map((course) => {
            if (course.id !== courseId) return course;
            return {
               ...course,
               chapters: course.chapters.map((chapter) =>
                  chapter.id === chapterId ? { ...chapter, name } : chapter
               ),
            };
         })
      );
   };

   const commitChapterText = () => {
      saveState(courses);
   };

   const deleteChapter = (courseId: string, chapterId: string) => {
      const next = courses.map((course) => {
         if (course.id !== courseId) return course;
         return { ...course, chapters: course.chapters.filter((chapter) => chapter.id !== chapterId) };
      });
      saveState(next);
   };

   const addCourse = () => {
      const id = crypto.randomUUID();
      const next = [
         ...courses,
         {
            id,
            code: 'NEW',
            name: 'New Course',
            colorClass: 'bg-black/5 text-text-primary',
            icon: 'FolderOpen' as const,
            assignments: [],
            chapters: [{ id: `${id}-chapter-1`, name: 'Chapter 1', completed: false }],
         },
      ];
      saveState(next);
   };

   return (
      <div className="w-full h-full text-text-primary overflow-y-auto">
         <div className="p-10 w-full max-w-[1600px] mx-auto animate-in fade-in">
            <h1 className="text-3xl font-bold mb-10 text-text-primary">College</h1>

            <div className="mb-10">
               <h2 className="text-xl font-bold mb-4 text-text-primary">Bookmarks</h2>
               <hr className="border-border-default mb-4" />
               <div className="flex items-center gap-2 text-sm font-semibold hover:bg-black/5 w-fit px-3 py-1.5 rounded cursor-pointer transition-colors text-text-secondary">
                  <CalendarIcon size={16} className="text-accent-red" /> Assignment/Exam Schedule
               </div>
            </div>

            <div className="mb-12">
               <div className="flex items-center gap-3 mb-6">
                  <BookOpen size={20} className="text-text-tertiary" />
                  <h2 className="text-xl font-bold text-text-primary">Syllabus</h2>
               </div>
               <hr className="border-border-default mb-8" />

               <div className="flex items-start gap-8 overflow-x-auto pb-10 custom-scrollbar">
                  {courses.map((course) => {
                     const IconCmp = ICON_MAP[course.icon] || FolderOpen;
                     const completedChapters = course.chapters.filter((chapter) => chapter.completed).length;
                     const totalChapters = Math.max(1, course.chapters.length);
                     const progress = Math.round((completedChapters / totalChapters) * 100);

                     return (
                        <div key={`${course.id}-syllabus`} className="min-w-[240px] w-[240px] flex flex-col gap-4">
                           <div className={clsx('px-4 py-2.5 rounded flex items-center gap-2 font-bold text-sm', course.colorClass)}>
                              <IconCmp size={16} /> {course.code}
                           </div>

                           <div className="rounded-xl border border-border-default bg-white px-3 py-3">
                              <div className="flex items-center justify-between text-[11px] font-semibold text-text-secondary mb-2">
                                 <span>{completedChapters} / {course.chapters.length} chapters</span>
                                 <span>{progress}%</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden">
                                 <div
                                    className="h-full rounded-full"
                                    style={{ width: `${progress}%`, backgroundColor: '#2979ff', transition: 'width 0.4s ease' }}
                                 />
                              </div>
                           </div>

                           <div className="flex flex-col gap-3">
                              {course.chapters.map((chapter) => (
                                 <div key={chapter.id} className="grid grid-cols-[20px_1fr] items-start gap-3 group relative">
                                    <input
                                       type="checkbox"
                                       checked={chapter.completed}
                                       onChange={() => toggleChapter(course.id, chapter.id)}
                                       className="w-5 h-5 rounded mt-0.5 appearance-none border border-border-default bg-white checked:bg-[#2979ff] checked:border-[#2979ff] transition-colors cursor-pointer relative shadow-sm"
                                    />
                                    {chapter.completed && (
                                       <svg className="absolute left-1 top-1.5 w-3 h-3 text-white pointer-events-none" viewBox="0 0 24 24" fill="none">
                                          <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                       </svg>
                                    )}

                                    <div className="relative">
                                       <input
                                          value={chapter.name}
                                          onChange={(event) => updateChapterText(course.id, chapter.id, event.target.value)}
                                          onBlur={commitChapterText}
                                          className={clsx(
                                             'w-full bg-transparent text-[13px] leading-snug outline-none hover:bg-black/5 px-1 py-0.5 rounded transition-colors block resize-none',
                                             chapter.completed ? 'text-text-tertiary line-through' : 'text-text-secondary'
                                          )}
                                       />
                                       <button
                                          onClick={() => deleteChapter(course.id, chapter.id)}
                                          className="absolute right-0 top-1 text-text-tertiary hover:text-accent-red opacity-0 group-hover:opacity-100 transition-opacity"
                                          aria-label="Delete chapter"
                                       >
                                          <Trash2 size={12} />
                                       </button>
                                    </div>
                                 </div>
                              ))}

                              <button
                                 onClick={() => addChapter(course.id)}
                                 className="flex items-center gap-2 text-text-tertiary hover:text-text-primary text-xs font-semibold px-1 py-1 rounded transition-colors w-fit mt-1"
                              >
                                 <Plus size={14} /> Add Chapter
                              </button>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>

            <div>
               <div className="flex items-center gap-3 mb-6">
                  <CheckSquare size={20} className="text-text-tertiary" />
                  <h2 className="text-xl font-bold text-text-primary">Academic To-Do List</h2>
               </div>
               <hr className="border-border-default mb-8" />

               <div className="flex items-start gap-8 overflow-x-auto pb-10 custom-scrollbar">
                  {courses.map((course) => {
                     const IconCmp = ICON_MAP[course.icon] || FolderOpen;

                     return (
                        <div key={course.id} className="min-w-[240px] w-[240px] flex flex-col gap-4">
                           <div className={clsx('px-4 py-2.5 rounded flex items-center gap-2 font-bold text-sm', course.colorClass)}>
                              <IconCmp size={16} /> {course.code}
                           </div>

                           <div className="flex flex-col gap-3">
                              {course.assignments.map((task) => (
                                 <div key={task.id} className="grid grid-cols-[20px_1fr] items-start gap-3 group relative">
                                    <input
                                       type="checkbox"
                                       checked={task.completed}
                                       onChange={() => toggleTask(course.id, task.id)}
                                       className="w-5 h-5 rounded mt-0.5 appearance-none border border-border-default bg-white checked:bg-accent-blue checked:border-accent-blue transition-colors cursor-pointer relative shadow-sm"
                                    />
                                    {task.completed && (
                                       <svg className="absolute left-1 top-1.5 w-3 h-3 text-white pointer-events-none" viewBox="0 0 24 24" fill="none">
                                          <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                       </svg>
                                    )}

                                    <div className="relative">
                                       <input
                                          value={task.text}
                                          onChange={(event) => updateTaskText(course.id, task.id, event.target.value)}
                                          onBlur={commitTaskText}
                                          className={clsx(
                                             'w-full bg-transparent text-[13px] leading-snug outline-none hover:bg-black/5 px-1 py-0.5 rounded transition-colors block resize-none',
                                             task.completed ? 'text-text-tertiary line-through' : 'text-text-secondary'
                                          )}
                                       />
                                       <button
                                          onClick={() => deleteTask(course.id, task.id)}
                                          className="absolute right-0 top-1 text-text-tertiary hover:text-accent-red opacity-0 group-hover:opacity-100 transition-opacity"
                                          aria-label="Delete task"
                                       >
                                          <Trash2 size={12} />
                                       </button>
                                    </div>
                                 </div>
                              ))}

                              <button
                                 onClick={() => addTask(course.id)}
                                 className="flex items-center gap-2 text-text-tertiary hover:text-text-primary text-xs font-semibold px-1 py-1 rounded transition-colors w-fit mt-1"
                              >
                                 <Plus size={14} /> Add item
                              </button>
                           </div>
                        </div>
                     );
                  })}

                  <div className="min-w-[240px] w-[240px]">
                     <button
                        onClick={addCourse}
                        className="w-full py-2.5 rounded border border-dashed border-border-default text-text-secondary hover:text-text-primary hover:border-text-secondary transition-colors flex items-center justify-center gap-2 text-sm font-bold bg-white shadow-sm"
                     >
                        <Plus size={16} /> Add Course
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
