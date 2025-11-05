import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Teacher, ScheduleSlot } from "@shared/schema";
import type { ScheduleSlotData } from "@/types/schedule";
import type { ClassScheduleSlot } from "@/components/ClassScheduleTable";
import { DAYS, PERIODS } from "@shared/schema";
import { loadMultipleFonts } from "./arabicFont";
import type { PDFCustomizationOptions } from "@/types/pdfCustomization";
import { DEFAULT_PDF_OPTIONS } from "@/types/pdfCustomization";

export async function exportTeacherSchedulePDF(
  teacher: Teacher,
  slots: ScheduleSlotData[],
  customOptions?: PDFCustomizationOptions
) {
  const options = { ...DEFAULT_PDF_OPTIONS, ...customOptions };
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const fonts = await loadMultipleFonts(
    doc,
    options.headerFont,
    options.contentFont,
    options.dayFont,
    options.customHeaderFont,
    options.customContentFont,
    options.customDayFont
  );

  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont(fonts.header);
  doc.setFontSize(22);
  doc.text(`جدول حصص المعلم: ${teacher.name}`, pageWidth / 2, 15, {
    align: "center",
  });

  doc.setFontSize(16);
  doc.text(`المادة: ${teacher.subject}`, pageWidth / 2, 25, {
    align: "center",
  });

  const headers = [...PERIODS.map((p) => `الحصة ${p}`).reverse(), "اليوم"];
  const body = DAYS.map((day) => {
    const row: string[] = [];
    [...PERIODS].reverse().forEach((period) => {
      const slot = slots.find((s) => s.day === day && s.period === period);
      row.push(slot ? `${slot.grade}/${slot.section}` : "-");
    });
    row.push(day);
    return row;
  });

  autoTable(doc, {
    head: [headers],
    body: body,
    startY: 35,
    styles: {
      font: "moo",
      fontSize: options.contentFontSize,
      halign: "center",
      valign: "middle",
      cellPadding: { top: 5, right: 6, bottom: 5, left: 6 },
      textColor: options.contentTextColor,
      minCellHeight: 10,
    },
    headStyles: {
      fillColor: options.themeColor,
      textColor: [255, 255, 255],
      fontStyle: "normal",
      fontSize: options.headerFontSize,
      font: fonts.header,
      cellPadding: { top: 6, right: 6, bottom: 6, left: 6 },
      minCellHeight: 12,
    },
    columnStyles: {
      7: { halign: "right", fontStyle: "normal", fontSize: options.dayFontSize, font: fonts.day, textColor: options.dayTextColor, cellWidth: 'auto' },
    },
    margin: { left: 15, right: 15 },
    tableWidth: 'auto',
  });

  doc.setFont(fonts.content);
  doc.setFontSize(9);
  doc.text(
    `عدد الحصص: ${slots.length}`,
    pageWidth - 15,
    doc.internal.pageSize.getHeight() - 10,
    { align: "right" }
  );

  doc.save(`جدول_${teacher.name}.pdf`);
}

export async function exportClassSchedulePDF(
  grade: number,
  section: number,
  slots: ClassScheduleSlot[],
  showTeacherNames: boolean,
  customOptions?: PDFCustomizationOptions
) {
  const options = { ...DEFAULT_PDF_OPTIONS, ...customOptions };
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const fonts = await loadMultipleFonts(
    doc,
    options.headerFont,
    options.contentFont,
    options.dayFont,
    options.customHeaderFont,
    options.customContentFont,
    options.customDayFont
  );

  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("Uthmanic");
  doc.setFontSize(30);
  doc.text(`${grade}/${section}`, pageWidth / 2, 20, { align: "center" });


  const headers = [...PERIODS.map((p) => `الحصة ${p}`).reverse(), "اليوم"];
  const body = DAYS.map((day) => {
    const row: string[] = [];
    [...PERIODS].reverse().forEach((period) => {
      const slot = slots.find((s) => s.day === day && s.period === period);
      if (slot) {
        const cellContent = showTeacherNames
          ? `${slot.subject}\n(${slot.teacherName})`
          : slot.subject;
        row.push(cellContent);
      } else {
        row.push("-");
      }
    });
    row.push(day);
    return row;
  });

  autoTable(doc, {
    head: [headers],
    body: body,
    startY: 22,
    styles: {
      font: fonts.content,
      fontSize: options.contentFontSize,
      halign: "center",
      valign: "middle",
      cellPadding: { top: 4, right: 5, bottom: 4, left: 5 },
      textColor: options.contentTextColor,
      minCellHeight: 9,
    },
    headStyles: {
      fillColor: options.themeColor,
      textColor: [255, 255, 255],
      fontStyle: "normal",
      fontSize: options.headerFontSize,
      font: fonts.header,
      cellPadding: { top: 5, right: 5, bottom: 5, left: 5 },
      minCellHeight: 11,
    },
    columnStyles: {
      7: { font: fonts.day, fontSize: options.dayFontSize, textColor: options.dayTextColor, halign: "center", cellWidth: 30 },
    },
    margin: { left: 10, right: 10 },
    tableWidth: 'auto',
  });

  doc.save(`جدول_صف_${grade}_${section}.pdf`);
}

export async function exportAllTeachersPDF(
  teachers: Teacher[],
  allSlots: ScheduleSlot[],
  customOptions?: PDFCustomizationOptions
) {
  const options = { ...DEFAULT_PDF_OPTIONS, ...customOptions };
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const fonts = await loadMultipleFonts(
    doc,
    options.headerFont,
    options.contentFont,
    options.dayFont,
    options.customHeaderFont,
    options.customContentFont,
    options.customDayFont
  );

  const pageWidth = doc.internal.pageSize.getWidth();
  let isFirstPage = true;

  teachers.forEach((teacher) => {
    if (!isFirstPage) {
      doc.addPage();
    }
    isFirstPage = false;

    const teacherSlots: ScheduleSlotData[] = allSlots
      .filter((slot) => slot.teacherId === teacher.id)
      .map((slot) => ({
        day: slot.day,
        period: slot.period,
        grade: slot.grade,
        section: slot.section,
      }));

    doc.setFont(fonts.header);
    doc.setFontSize(16);
    doc.text(
      `جدول حصص: ${teacher.name}`,
      pageWidth - 15,
      15,
      { align: "right" }
    );

    doc.setFontSize(11);
    doc.text(
      `المادة: ${teacher.subject}`,
      pageWidth - 15,
      23,
      { align: "right" }
    );

    const headers = [...PERIODS.map((p) => `الحصة ${p}`).reverse(), "اليوم"];
    const body = DAYS.map((day) => {
      const row: string[] = [];
      [...PERIODS].reverse().forEach((period) => {
        const slot = teacherSlots.find(
          (s) => s.day === day && s.period === period
        );
        row.push(slot ? `${slot.grade}/${slot.section}` : "-");
      });
      row.push(day);
      return row;
    });

    autoTable(doc, {
      head: [headers],
      body: body,
      startY: 30,
      styles: {
        font: "moo",
        fontSize: options.contentFontSize,
        halign: "center",
        valign: "middle",
        cellPadding: { top: 4, right: 5, bottom: 4, left: 5 },
        textColor: options.contentTextColor,
        minCellHeight: 9,
      },
      headStyles: {
        fillColor: options.themeColor,
        textColor: [255, 255, 255],
        fontStyle: "normal",
        fontSize: options.headerFontSize,
        font: fonts.header,
        cellPadding: { top: 5, right: 5, bottom: 5, left: 5 },
        minCellHeight: 11,
      },
      columnStyles: {
        7: { halign: "right", fontStyle: "normal", fontSize: options.dayFontSize, font: fonts.day, textColor: options.dayTextColor, cellWidth: 'auto' },
      },
      margin: { left: 12, right: 12 },
      tableWidth: 'auto',
    });

    doc.setFont(fonts.content);
    doc.setFontSize(8);
    doc.text(
      `عدد الحصص: ${teacherSlots.length}`,
      pageWidth - 15,
      doc.internal.pageSize.getHeight() - 10,
      { align: "right" }
    );
  });

  doc.save("جداول_جميع_المعلمين.pdf");
}

export async function exportAllClassesPDF(
  allSlots: ScheduleSlot[],
  allTeachers: Teacher[],
  showTeacherNames: boolean,
  customOptions?: PDFCustomizationOptions,
  gradeSections?: Record<string, number[]>
) {
  const options = { ...DEFAULT_PDF_OPTIONS, ...customOptions };
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const fonts = await loadMultipleFonts(
    doc,
    options.headerFont,
    options.contentFont,
    options.dayFont,
    options.customHeaderFont,
    options.customContentFont,
    options.customDayFont
  );

  const pageWidth = doc.internal.pageSize.getWidth();
  const teacherMap = new Map(allTeachers.map((t) => [t.id, t]));
  let isFirstPage = true;

  for (let grade = 10; grade <= 12; grade++) {
    const sections = gradeSections?.[grade.toString()] || [1, 2, 3, 4, 5, 6, 7];
    for (const section of sections) {
      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;

      const classSlots = allSlots.filter(
        (slot) => slot.grade === grade && slot.section === section
      );

      const schedule: ClassScheduleSlot[] = classSlots.map((slot) => {
        const teacher = teacherMap.get(slot.teacherId);
        return {
          day: slot.day,
          period: slot.period,
          subject: (teacher?.subject || "عربي") as any,
          teacherName: teacher?.name || "Unknown",
        };
      });

      doc.setFont("Uthmanic");
      doc.setFontSize(30);
      doc.text(`${grade}/${section}`, pageWidth / 2, 20, { align: "center" });


      const headers = [...PERIODS.map((p) => `الحصة ${p}`).reverse(), "اليوم"];
      const body = DAYS.map((day) => {
        const row: string[] = [];
        [...PERIODS].reverse().forEach((period) => {
          const slot = schedule.find(
            (s) => s.day === day && s.period === period
          );
          if (slot) {
            const cellContent = showTeacherNames
              ? `${slot.subject}\n(${slot.teacherName})`
              : slot.subject;
            row.push(cellContent);
          } else {
            row.push("-");
          }
        });
        row.push(day);
        return row;
      });

      autoTable(doc, {
        head: [headers],
        body: body,
        startY: 22,
        styles: {
          font: fonts.content,
          fontSize: options.contentFontSize,
          halign: "center",
          valign: "middle",
          cellPadding: { top: 4, right: 5, bottom: 4, left: 5 },
          textColor: options.contentTextColor,
          minCellHeight: 9,
        },
        headStyles: {
          fillColor: options.themeColor,
          textColor: [255, 255, 255],
          fontStyle: "normal",
          fontSize: options.headerFontSize,
          font: fonts.header,
          cellPadding: { top: 5, right: 5, bottom: 5, left: 5 },
          minCellHeight: 11,
        },
        columnStyles: {
          7: { font: fonts.day, fontSize: options.dayFontSize, textColor: options.dayTextColor, halign: "right", cellWidth: 'auto' },
        },
        margin: { left: 12, right: 12 },
        tableWidth: 'auto',
      });
    }
  }

  doc.save("جداول_جميع_الصفوف.pdf");
}

export async function exportMasterSchedulePDF(
  teachers: Teacher[],
  allSlots: ScheduleSlot[],
  teacherNotes: Record<string, string>,
  customOptions?: PDFCustomizationOptions
) {
  const options = { ...DEFAULT_PDF_OPTIONS, ...customOptions };
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a3", // استخدام A3 لاستيعاب الجدول الكبير
  });

  const fonts = await loadMultipleFonts(
    doc,
    options.headerFont,
    options.contentFont,
    options.dayFont,
    options.customHeaderFont,
    options.customContentFont,
    options.customDayFont
  );

  const pageWidth = doc.internal.pageSize.getWidth();

  // عنوان الجدول
  doc.setFont(fonts.header);
  doc.setFontSize(18);
  doc.text("جدول الحصص الأسبوعي", pageWidth / 2, 12, {
    align: "center",
  });

  // بناء جدول واحد كبير يشمل جميع المعلمين (من اليمين لليسار)
  const headers: string[] = [];
  
  // من اليمين لليسار: ملاحظات، ثم الأيام (من الخميس إلى الأحد)، ثم عدد الحصص، المادة، اسم المعلم، م
  headers.push("ملاحظات");
  
  // أعمدة الأيام من اليمين لليسار (الخميس، الأربعاء، الثلاثاء، الاثنين، الأحد)
  [...DAYS].reverse().forEach((day) => {
    [...PERIODS].reverse().forEach((period) => {
      headers.push(`${period}`);
    });
  });
  
  // باقي الأعمدة
  headers.push("عدد\nالحصص");
  headers.push("المادة");
  headers.push("اسم المعلم");
  headers.push("م");

  const body: string[][] = [];
  
  teachers.forEach((teacher, index) => {
    const row: string[] = [];
    
    // من اليمين لليسار
    // الملاحظات
    row.push(teacherNotes[teacher.id] || "");
    
    // الحصص لكل يوم وفترة (من الخميس إلى الأحد، من الحصة 7 إلى 1)
    [...DAYS].reverse().forEach((day) => {
      [...PERIODS].reverse().forEach((period) => {
        const slot = allSlots.find(
          (s) => s.teacherId === teacher.id && s.day === day && s.period === period
        );
        row.push(slot ? `${slot.grade}/${slot.section}` : "");
      });
    });
    
    // عدد الحصص
    const teacherSlotsCount = allSlots.filter(s => s.teacherId === teacher.id).length;
    row.push(teacherSlotsCount.toString());
    
    // المادة
    row.push(teacher.subject);
    
    // اسم المعلم
    row.push(teacher.name);
    
    // رقم تسلسلي
    row.push((index + 1).toString());
    
    body.push(row);
  });

  // إضافة صف عناوين الأيام
  const dayHeaders: string[] = [];
  dayHeaders.push(""); // ملاحظات
  [...DAYS].reverse().forEach((day) => {
    dayHeaders.push(day);
    // إضافة خلايا فارغة للحصص الأخرى
    for (let i = 0; i < PERIODS.length - 1; i++) {
      dayHeaders.push("");
    }
  });
  dayHeaders.push(""); // عدد الحصص
  dayHeaders.push(""); // المادة
  dayHeaders.push(""); // اسم المعلم
  dayHeaders.push(""); // م

  // حساب عرض الجدول الإجمالي
  const totalTableWidth = 20 + (35 * 7) + 8 + 14 + 28 + 6; // مجموع أعرضة الأعمدة
  const pageWidthMM = doc.internal.pageSize.getWidth();
  const leftMargin = (pageWidthMM - totalTableWidth) / 2; // توسيط الجدول

  autoTable(doc, {
    head: [dayHeaders, headers],
    body: body,
    startY: 18,
    styles: {
      font: fonts.content,
      fontSize: 6,
      halign: "center",
      valign: "middle",
      cellPadding: { top: 0.8, right: 0.3, bottom: 0.8, left: 0.3 },
      textColor: options.contentTextColor,
      minCellHeight: 4.5,
      lineWidth: 0.1,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: options.themeColor,
      textColor: [255, 255, 255],
      fontStyle: "normal",
      fontSize: 6,
      font: fonts.header,
      cellPadding: { top: 1, right: 0.3, bottom: 1, left: 0.3 },
      minCellHeight: 5,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 20, halign: "right", font: fonts.content, fontSize: 5 }, // ملاحظات
      // الحصص - كل خلية صغيرة
      ...Object.fromEntries(
        Array.from({ length: 35 }, (_, i) => [
          i + 1,
          { cellWidth: 7, halign: "center", fontSize: 6 },
        ])
      ),
      36: { cellWidth: 8, halign: "center" }, // عدد الحصص
      37: { cellWidth: 14, halign: "center", font: fonts.content }, // المادة
      38: { cellWidth: 28, halign: "right", font: fonts.content }, // اسم المعلم
      39: { cellWidth: 6, halign: "center" }, // م
    },
    margin: { top: 8, right: leftMargin, bottom: 8, left: leftMargin },
    tableWidth: totalTableWidth,
    theme: 'grid',
    didDrawCell: function(data) {
      // دمج خلايا الأيام في الصف الأول من الرأس
      if (data.section === 'head' && data.row.index === 0) {
        const col = data.column.index;
        // تحديد خلايا الأيام
        if (col >= 1 && col <= 35) {
          const dayIndex = Math.floor((col - 1) / 7);
          const periodIndex = (col - 1) % 7;
          if (periodIndex !== 0) {
            // إخفاء النص للخلايا المدمجة
            return;
          }
        }
      }
    },
    didDrawPage: function (data) {
      // التأكد من أن كل شيء في صفحة واحدة
      if (data.pageNumber > 1) {
        console.warn('الجدول كبير جداً - قد يحتاج لتصغير إضافي');
      }
    },
  });

  doc.save("الجدول_الرئيسي.pdf");
}
