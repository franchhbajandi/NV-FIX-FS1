import React from 'react';
import { institutionalData } from '../data/institutional';
import { educationalPhilosophy } from '../data/philosophy';
import { episodesData } from '../data/episodes';
import { appendicesData, resolveAppendixPhotoSrc } from '../data/appendices';
import {
  shouldHidePending,
  isStatusPending,
  getEpisodeId,
  getEpisodeShortId,
  getEpisodeActivities,
  getEpisodeStatus,
  getQuestionPrompt,
  getQuestionPullquote,
  getQuestionId,
  getClassroomMatrixData,
  getSchoolFacilitiesData,
  getPsychosocialChecklistData,
  getPsychosocialItemText,
  splitParagraphs,
  isIgnoredKey,
  formatObservationStatusSymbol,
} from '../data/contentIntake';
import { EpisodeQuestion } from '../data/types';
import { AnswerBlock, renderAsteriskEmphasis } from './AnswerBlock';
import { EmphasizedText } from './EmphasizedText';
import { MatrixTable } from './MatrixTable';
import { PullQuote } from './PullQuote';
import {
  AutoPhotoFrame,
  getPhotosForEpisode,
  getPhotoByFileMatch,
} from './AutoPhotoFrame';
import { PhotoFrame } from './PhotoFrame';
import { Button } from './Button';
import { Printer, ArrowLeft } from 'lucide-react';
import { buLogoSrc, buceLogoSrc } from './TitlePage';

export interface PrintEditionProps {
  onBackToDigital: () => void;
}

export const PrintEdition: React.FC<PrintEditionProps> = ({ onBackToDigital }) => {
  const hidePending = shouldHidePending();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen surface-card text-[var(--color-ink)] font-body antialiased">
      {/* Screen-only control bar */}
      <aside
        aria-label="Print edition controls"
        className="no-print sticky top-0 z-50 surface-chalkboard px-[var(--space-24)] py-[var(--space-12)] flex flex-wrap items-center justify-between gap-[var(--space-16)] border-b-2 border-[var(--color-border-dark)]"
      >
        <div className="flex items-center gap-[var(--space-16)]">
          <Button variant="secondary-dark" onClick={onBackToDigital}>
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Back to digital edition</span>
          </Button>
          <span className="text-scale-14 text-[var(--color-chalk)] font-semibold">
            A4 print edition (/print) · All expanders open, links preserved
          </span>
        </div>

        <Button variant="primary-highlighter" onClick={handlePrint}>
          <Printer size={16} aria-hidden="true" />
          <span>Print or save as PDF</span>
        </Button>
      </aside>

      {/* Main A4 Print Container */}
      <main className="max-w-4xl mx-auto p-[var(--space-24)] sm:p-[var(--space-48)] space-y-[var(--space-48)]">
        {/* ========================================================= */}
        {/* COVER / TITLE PAGE                                        */}
        {/* ========================================================= */}
        <section className="py-[var(--space-48)] border-b-2 border-[var(--color-ink)] break-after-page space-y-[var(--space-32)]">
          <div className="flex items-center gap-[var(--space-16)]">
            <img
              src={buLogoSrc}
              alt="Bicol University logo"
              width={64}
              height={64}
              className="w-16 h-16 min-w-[48px] min-h-[48px] object-contain"
            />
            <img
              src={buceLogoSrc}
              alt="Bicol University College of Education logo"
              width={64}
              height={64}
              className="w-16 h-16 min-w-[48px] min-h-[48px] object-contain"
            />
          </div>

          <div className="space-y-[var(--space-4)] text-scale-14 text-[var(--color-chalk-muted)]">
            <p className="font-bold text-[var(--color-ink)]">{institutionalData.institution.republic}</p>
            <p>{institutionalData.institution.university}</p>
            <p>{institutionalData.institution.college}</p>
            <p className="font-semibold text-[var(--color-ink)]">{institutionalData.institution.office}</p>
            <p>{institutionalData.institution.location}</p>
          </div>

          <div className="py-[var(--space-32)] border-y-2 border-[var(--color-ink)] space-y-[var(--space-16)]">
            <p className="text-scale-14 font-semibold text-[var(--color-red-pen)]">
              Field Study 1 portfolio · Print edition
            </p>
            <h1 className="font-display font-extrabold text-scale-64 text-[var(--color-ink)]">
              {institutionalData.course.title}
            </h1>
            <p className="font-display font-bold text-scale-28 text-[var(--color-chalk-muted)]">
              The Observer’s Edition
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--space-24)] text-scale-14">
            <div className="p-[var(--space-16)] shape-index-card-plain space-y-[var(--space-4)]">
              <p className="font-semibold text-[var(--color-chalk-muted)]">Pre-service teacher observer</p>
              <p className="font-display font-bold text-scale-20 text-[var(--color-ink)]">
                {institutionalData.student.name}
              </p>
              <p>
                {institutionalData.student.degree} ({institutionalData.student.major})
              </p>
              <p>{institutionalData.student.yearLevel}</p>
            </div>

            <div className="p-[var(--space-16)] shape-index-card-plain space-y-[var(--space-4)]">
              <p className="font-semibold text-[var(--color-chalk-muted)]">Resource teacher</p>
              <p className="font-display font-bold text-scale-20 text-[var(--color-ink)]">
                {appendicesData.resourceTeacher.name}
              </p>
              <p>{appendicesData.resourceTeacher.designation}</p>
              <p>{appendicesData.resourceTeacher.subjectArea}</p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* CLICKABLE TABLE OF CONTENTS                               */}
        {/* ========================================================= */}
        <section id="print-toc" className="space-y-[var(--space-24)] break-after-page">
          <div className="border-b-2 border-[var(--color-ink)] pb-[var(--space-8)]">
            <h2 className="font-display font-extrabold text-scale-40 text-[var(--color-ink)]">
              Table of contents
            </h2>
          </div>

          <div className="space-y-[var(--space-24)] text-scale-14">
            <div className="space-y-[var(--space-8)]">
              <h3 className="font-display font-bold text-scale-20">Act I: Opening</h3>
              <ul className="space-y-[var(--space-4)]">
                <li>
                  <a href="#print-acknowledgements" className="btn-ghost">
                    Acknowledgement
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-[var(--space-8)]">
              <h3 className="font-display font-bold text-scale-20">Act II: Foundations</h3>
              <ul className="space-y-[var(--space-4)]">
                <li>
                  <a href="#print-intro" className="btn-ghost">
                    Field Study 1 course description and learning outcomes
                  </a>
                </li>
                <li>
                  <a href="#print-prayer" className="btn-ghost">
                    Prayer of the field study student
                  </a>
                </li>
                <li>
                  <a href="#print-philosophy" className="btn-ghost font-semibold">
                    Personal educational philosophy
                  </a>
                </li>
                <li>
                  <a href="#print-vmgo" className="btn-ghost">
                    Bicol University and DepEd vision and mission
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-[var(--space-8)]">
              <h3 className="font-display font-bold text-scale-20">
                Act III: The field (Episodes 01–06)
              </h3>
              <ul className="space-y-[var(--space-8)]">
                {episodesData.map((ep) => {
                  const epId = getEpisodeId(ep);
                  const pending = isStatusPending(getEpisodeStatus(ep), epId);
                  if (hidePending && pending) return null;
                  const activities = getEpisodeActivities(ep, hidePending);
                  return (
                    <li key={epId} className="space-y-[var(--space-4)]">
                      <div className="flex items-center justify-between">
                        <a href={`#print-${epId}`} className="btn-ghost font-semibold">
                          Episode {ep.number}: {ep.title}
                        </a>
                        {!hidePending && pending && (
                          <span className="text-scale-12 text-[var(--color-chalk-muted)]">pending</span>
                        )}
                      </div>
                      {activities.length > 0 && (
                        <ul className="pl-[var(--space-16)] space-y-[2px] text-scale-14 text-[var(--color-chalk-muted)]">
                          {activities.map((act) => (
                            <li
                              key={act.id}
                              className={act.isSubActivity ? 'pl-[var(--space-16)]' : ''}
                            >
                              <a href={`#${act.id}`} className="btn-ghost">
                                <span className="font-mono font-semibold text-[var(--color-ink)]">
                                  {act.label}
                                </span>
                                {act.title ? ` · ${act.title}` : ''}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="space-y-[var(--space-8)]">
              <h3 className="font-display font-bold text-scale-20">
                Act IV: Evidence and appendices
              </h3>
              <ul className="space-y-[var(--space-4)]">
                <li>
                  <a href="#print-appendices" className="btn-ghost">
                    Resource teacher profile, class program, worksheets, and clearance
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* ACT I: ACKNOWLEDGEMENT                                    */}
        {/* ========================================================= */}
        <section id="print-acknowledgements" className="space-y-[var(--space-16)] break-after-page">
          <h2 className="font-display font-extrabold text-scale-40 text-[var(--color-ink)] border-b-2 border-[var(--color-ink)] pb-[var(--space-8)]">
            {institutionalData.acknowledgement.title}
          </h2>
          <div className="space-y-[var(--space-16)] text-scale-17 reading-measure">
            {institutionalData.acknowledgement.paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* ACT II: FOUNDATIONS                                       */}
        {/* ========================================================= */}
        <section id="print-intro" className="space-y-[var(--space-24)] break-after-page">
          <h2 className="font-display font-extrabold text-scale-40 text-[var(--color-ink)] border-b-2 border-[var(--color-ink)] pb-[var(--space-8)]">
            Act II: Foundations
          </h2>

          <p className="text-scale-17 reading-measure">
            {institutionalData.course.description}
          </p>

          <div className="space-y-[var(--space-12)]">
            <h3 className="font-display font-bold text-scale-28">
              Course learning outcomes
            </h3>
            <ol className="space-y-[var(--space-8)] text-scale-14">
              {institutionalData.course.outcomes.map((clo) => (
                <li key={clo.number} className="p-[var(--space-12)] shape-index-card-plain">
                  <span className="font-bold">Outcome {clo.number}:</span> {clo.statement}{' '}
                  <span className="text-[var(--color-chalk-muted)]">({clo.domainAlignment})</span>
                </li>
              ))}
            </ol>
          </div>

          <div id="print-prayer" className="p-[var(--space-24)] shape-index-card space-y-[var(--space-12)] break-inside-avoid">
            <h3 className="font-display font-bold text-scale-28">
              {institutionalData.prayer.title}
            </h3>
            {institutionalData.prayer.content.map((para, i) => (
              <p key={i} className="text-scale-17 reading-measure">
                {para}
              </p>
            ))}
          </div>

          <div id="print-philosophy" className="space-y-[var(--space-16)] pt-[var(--space-16)] break-inside-avoid">
            <h3 className="font-display font-bold text-scale-28">
              {educationalPhilosophy.title}
            </h3>
            <PullQuote
              quote={educationalPhilosophy.credo}
              attribution={educationalPhilosophy.author}
              role={educationalPhilosophy.date}
            />
            <div className="space-y-[var(--space-12)]">
              {educationalPhilosophy.statements.map((st) => (
                <div key={st.id} className="p-[var(--space-16)] shape-index-card-plain text-scale-17">
                  <span>{st.lead}</span>
                  <strong className="underline decoration-[var(--color-red-pen)]">
                    {st.emphasis}
                  </strong>
                  <span>{st.rest}</span>
                </div>
              ))}
            </div>
          </div>

          {(institutionalData as Record<string, any>).certificateOfCompletion?.file &&
            resolveAppendixPhotoSrc(
              (institutionalData as Record<string, any>).certificateOfCompletion.file
            ) && (
              <div
                id="print-certificate-of-completion"
                className="p-[var(--space-24)] shape-index-card-plain space-y-[var(--space-12)] break-inside-avoid"
              >
                <h3 className="font-display font-bold text-scale-28">
                  {(institutionalData as Record<string, any>).certificateOfCompletion.title ||
                    'Certificate of Completion'}
                </h3>
                <div className="p-[var(--space-12)] shape-index-card-plain">
                  <a
                    href={resolveAppendixPhotoSrc(
                      (institutionalData as Record<string, any>).certificateOfCompletion.file
                    )}
                    target="_blank"
                    rel="noopener"
                    className="block"
                  >
                    <img
                      src={resolveAppendixPhotoSrc(
                        (institutionalData as Record<string, any>).certificateOfCompletion.file
                      )}
                      alt={
                        (institutionalData as Record<string, any>).certificateOfCompletion.alt ||
                        'Certificate of Completion'
                      }
                      className="max-h-[210mm] w-auto max-w-full mx-auto object-contain block"
                    />
                  </a>
                </div>
                <div>
                  <a
                    href={resolveAppendixPhotoSrc(
                      (institutionalData as Record<string, any>).certificateOfCompletion.file
                    )}
                    target="_blank"
                    rel="noopener"
                    className="inline-block text-scale-14 font-semibold text-[var(--color-ink)] underline underline-offset-4"
                  >
                    Open full size
                  </a>
                </div>
              </div>
            )}

          <div id="print-vmgo" className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-24)] break-inside-avoid">
            <div className="p-[var(--space-16)] shape-index-card-plain space-y-[var(--space-8)] text-scale-14">
              <h4 className="font-display font-bold text-scale-20">Bicol University</h4>
              <p>
                <strong>Vision:</strong> {institutionalData.buVMGO.vision}
              </p>
              <p>
                <strong>Mission:</strong> {institutionalData.buVMGO.mission}
              </p>
            </div>
            <div className="p-[var(--space-16)] shape-index-card-plain space-y-[var(--space-8)] text-scale-14">
              <h4 className="font-display font-bold text-scale-20">Department of Education</h4>
              <p>
                <strong>Vision:</strong> {institutionalData.depEdVMGO.vision}
              </p>
              <p>
                <strong>Mission:</strong> {institutionalData.depEdVMGO.mission}
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* ACT III: LEARNING EPISODES                                */}
        {/* All AnswerBlocks forced open (`forceExpanded={true}`)     */}
        {/* ========================================================= */}
        {episodesData.map((ep) => {
          const epId = getEpisodeId(ep);
          const epShort = getEpisodeShortId(ep);
          const epStatus = getEpisodeStatus(ep);
          const isEpisodePending = isStatusPending(epStatus, epId);

          if (isEpisodePending) {
            return null;
          }

          const cmData = getClassroomMatrixData(ep);
          const sfData = getSchoolFacilitiesData(ep);
          const psyData = getPsychosocialChecklistData(ep);

          const inlinePhotoKeys = new Set<string>();
          cmData.rows.forEach((row) => {
            (row.photos || []).forEach((p) => {
              const rec = getPhotoByFileMatch(p);
              if (rec) inlinePhotoKeys.add(rec.cleanKey);
            });
          });
          sfData.rows.forEach((row) => {
            (row.photos || []).forEach((p) => {
              const rec = getPhotoByFileMatch(p);
              if (rec) inlinePhotoKeys.add(rec.cleanKey);
            });
          });
          if (ep.personalIllustration?.image) {
            const rec = getPhotoByFileMatch(ep.personalIllustration.image);
            if (rec) inlinePhotoKeys.add(rec.cleanKey);
          }

          const allEpPhotos = getPhotosForEpisode(ep.number);
          const remainingPhotos = allEpPhotos.filter(
            (p) => p.role !== 'mood' && !inlinePhotoKeys.has(p.cleanKey)
          );

          const visibleSections = (ep.sections || []).filter((sec, sIdx) => {
            if (!hidePending) return true;
            const secPath = `${epId}.sections[${sIdx}]`;
            const legacyKey = `${epId}.${sec.id}`;
            return !isStatusPending(sec.status, secPath, legacyKey);
          });

          const filterQList = (
            list: EpisodeQuestion[] | undefined,
            pathPrefix: string,
            prefix: string
          ) =>
            (list || []).filter((q, idx) => {
              if (!hidePending) return true;
              const pathKey = `${pathPrefix}[${idx}]`;
              const qId = getQuestionId(ep.number, prefix, q, idx);
              return !isStatusPending(q.status, pathKey, qId);
            });

          const visibleQuestions = filterQList(ep.questions, `${epId}.questions`, 'q');
          const visibleClassroomQuestions = filterQList(
            ep.classroomQuestions,
            `${epId}.classroomQuestions`,
            'cq'
          );
          const visibleReflectSchool = filterQList(
            ep.reflectSchool,
            `${epId}.reflectSchool`,
            'rs'
          );
          const visiblePsychosocialReflect = filterQList(
            ep.psychosocialReflect,
            `${epId}.psychosocialReflect`,
            'pr'
          );

          const visibleTables = (ep.tables || []).filter((t, tIdx) => {
            if (!hidePending) return true;
            return !t.isPending && !isStatusPending(t.status, `${epId}.tables[${tIdx}]`, t.id);
          });

          const showReflection =
            ep.reflection &&
            (!hidePending ||
              !isStatusPending(
                ep.reflection.status,
                `${epId}.reflection`,
                `${epId}-reflection`
              ));

          const reflectionParagraphs = ep.reflection
            ? splitParagraphs(ep.reflection.text)
            : [];

          return (
            <section
              key={epId}
              id={`print-${epId}`}
              className="space-y-[var(--space-24)] break-after-page"
            >
              <header className="border-b-2 border-[var(--color-ink)] pb-[var(--space-16)] space-y-[var(--space-8)]">
                {ep.ppstDomains && ep.ppstDomains.length > 0 && (
                  <p className="text-scale-14 font-semibold text-[var(--color-chalk-muted)]">
                    Episode {ep.number} · {ep.ppstDomains.join(' · ')}
                  </p>
                )}
                <h2 className="font-display font-extrabold text-scale-40 text-[var(--color-ink)]">
                  <span aria-hidden="true">{ep.number} · </span>
                  {ep.titleLines && ep.titleLines.length > 0 ? (
                    ep.titleLines.map((line, lIdx) => (
                      <React.Fragment key={lIdx}>
                        {lIdx > 0 && <span aria-hidden="true"> / </span>}
                        <span data-verify-id={`${epId}-titleLine-${lIdx + 1}`}>{line}</span>
                      </React.Fragment>
                    ))
                  ) : (
                    <span data-verify-id={`${epId}-title`}>{ep.title}</span>
                  )}
                </h2>
                {ep.thesis && (
                  <p
                    data-verify-id={`${epId}-thesis`}
                    className="font-display font-bold text-scale-20 text-[var(--color-ink)]"
                  >
                    {ep.thesis}
                  </p>
                )}
                {ep.keyFinding && (
                  <p className="text-scale-14 text-[var(--color-chalk-muted)]">
                    <span aria-hidden="true">Key finding: </span>
                    <span data-verify-id={`${epId}-keyFinding`}>{ep.keyFinding}</span>
                  </p>
                )}
                {(ep.school ||
                  ep.date ||
                  ep.timeObserved ||
                  ep.gradeSection ||
                  ep.gradeSections ||
                  ep.sectionsObserved ||
                  ep.resourceTeacher) && (
                  <p className="text-scale-14 text-[var(--color-chalk-muted)] flex flex-wrap gap-[var(--space-12)]">
                    {ep.school && <span data-verify-id={`${epId}-school`}>{ep.school}</span>}
                    {ep.date && <span data-verify-id={`${epId}-date`}>{ep.date}</span>}
                    {ep.timeObserved && (
                      <span data-verify-id={`${epId}-timeObserved`}>{ep.timeObserved}</span>
                    )}
                    {ep.gradeSection && (
                      <span data-verify-id={`${epId}-gradeSection`}>{ep.gradeSection}</span>
                    )}
                    {ep.gradeSections && (
                      <span data-verify-id={`${epId}-gradeSections`}>{ep.gradeSections}</span>
                    )}
                    {ep.sectionsObserved && (
                      <span data-verify-id={`${epId}-sectionsObserved`}>
                        {ep.sectionsObserved}
                      </span>
                    )}
                    {ep.resourceTeacher && (
                      <span data-verify-id={`${epId}-resourceTeacher`}>
                        {ep.resourceTeacher}
                      </span>
                    )}
                  </p>
                )}
                {ep.themeQuote && (
                  <blockquote
                    data-verify-id={`${epId}-themeQuote`}
                    className="font-display font-bold text-scale-20 text-[var(--color-ink)]"
                  >
                    {ep.themeQuote}
                  </blockquote>
                )}
              </header>

              {visibleSections.map((sec) => {
                const paras = sec.paragraphs || sec.content || [];
                return (
                  <div key={sec.id} className="space-y-[var(--space-8)] reading-measure">
                    <h3 className="font-display font-bold text-scale-20 text-[var(--color-ink)]">
                      {sec.title}
                    </h3>
                    {paras.map((p, pIdx) => (
                      <p key={pIdx} className="text-scale-17 text-[var(--color-ink)]">
                        {p}
                      </p>
                    ))}
                  </div>
                );
              })}

              {/* Delivered Episode 02: School Facilities */}
              {sfData.rows.length > 0 && (
                <div className="space-y-[var(--space-16)]">
                  <h3
                    data-verify-id={sfData.title ? `${epId}-schoolFacilities-title` : undefined}
                    className="font-display font-bold text-scale-20"
                  >
                    {sfData.title || 'School Facilities Checklist'}
                  </h3>
                  <table className="w-full border-collapse text-left text-scale-14 border-2 border-[var(--color-ink)]">
                    <thead>
                      <tr className="border-b-2 border-[var(--color-ink)] bg-[var(--color-chalk)]">
                        <th className="p-[var(--space-8)] border-r border-[var(--color-ink)]">
                          Facility
                        </th>
                        <th className="p-[var(--space-8)] border-r border-[var(--color-ink)] text-center">
                          Status
                        </th>
                        <th className="p-[var(--space-8)]">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sfData.rows.map((fac, fIdx) => {
                        const facId = `${epId}-fac-${fIdx + 1}`;
                        const isNA = fac.status === 'NA';
                        const statusVisibleLabel = isNA
                          ? 'Not available'
                          : fac.status === 'A'
                          ? 'Available'
                          : fac.status;
                        const rowPhotos = (fac.photos || [])
                          .map((p) => getPhotoByFileMatch(p))
                          .filter(Boolean);

                        return (
                          <tr
                            key={facId}
                            className="border-b border-[var(--color-border-light)] align-top"
                          >
                            <th className="p-[var(--space-8)] border-r border-[var(--color-ink)]">
                              <span data-verify-id={`${facId}-facility`}>{fac.facility}</span>
                            </th>
                            <td className="p-[var(--space-8)] border-r border-[var(--color-ink)] text-center font-mono font-bold">
                              <span
                                data-verify-id={`${facId}-status`}
                                data-verify-status={fac.status}
                              >
                                {statusVisibleLabel}
                              </span>
                            </td>
                            <td className="p-[var(--space-8)] space-y-[var(--space-8)]">
                              <span data-verify-id={`${facId}-description`}>
                                {fac.description}
                              </span>
                              {rowPhotos.map((photoRec) => (
                                <AutoPhotoFrame
                                  key={photoRec!.cleanKey}
                                  photo={photoRec!}
                                  shape="plain"
                                  treatment="none"
                                />
                              ))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Delivered Episode 02: Classroom Questions */}
              {visibleClassroomQuestions.length > 0 && (
                <div className="space-y-[var(--space-16)]">
                  <h3 className="font-display font-bold text-scale-20">
                    Classroom environment observation questions
                  </h3>
                  {visibleClassroomQuestions.map((q, qIdx) => {
                    const qId = getQuestionId(ep.number, 'cq', q, qIdx);
                    return (
                      <AnswerBlock
                        key={qId}
                        id={qId}
                        questionNumber={q.n}
                        prompt={getQuestionPrompt(q)}
                        answer={q.answer}
                        pullQuoteExcerpt={getQuestionPullquote(q)}
                        forceExpanded={true}
                      />
                    );
                  })}
                </div>
              )}

              {/* Delivered Episode 02: Classroom Matrix */}
              {cmData.rows.length > 0 && (
                <div className="space-y-[var(--space-16)]">
                  <h3
                    data-verify-id={cmData.title ? `${epId}-classroomMatrix-title` : undefined}
                    className="font-display font-bold text-scale-20"
                  >
                    {cmData.title || 'Classroom Facilities Matrix'}
                  </h3>
                  {cmData.rows.map((row, rIdx) => {
                    const rowId = `${epId}-cm-r${rIdx + 1}`;
                    const textKeys = Object.keys(row).filter(
                      (k) =>
                        k !== 'id' &&
                        k !== 'photos' &&
                        k !== 'status' &&
                        !isIgnoredKey(k) &&
                        typeof row[k] === 'string'
                    );
                    const rowPhotos = (row.photos || [])
                      .map((p) => getPhotoByFileMatch(p))
                      .filter(Boolean);

                    return (
                      <div
                        key={rowId}
                        className="p-[var(--space-16)] shape-index-card-plain space-y-[var(--space-8)] break-inside-avoid"
                      >
                        {textKeys.map((k, kIdx) => {
                          const val = String(row[k] ?? '');
                          return kIdx === 0 ? (
                            <h4
                              key={k}
                              data-verify-id={`${rowId}-${k}`}
                              className="font-display font-bold text-scale-17"
                            >
                              {val}
                            </h4>
                          ) : (
                            <p key={k} data-verify-id={`${rowId}-${k}`} className="text-scale-14">
                              {val}
                            </p>
                          );
                        })}
                        {rowPhotos.map((photoRec) => (
                          <AutoPhotoFrame
                            key={photoRec!.cleanKey}
                            photo={photoRec!}
                            shape="plain"
                            treatment="none"
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Delivered Episode 02: School Facilities Reflection */}
              {visibleReflectSchool.length > 0 && (
                <div className="space-y-[var(--space-16)]">
                  <h3 className="font-display font-bold text-scale-20">
                    School facilities reflection
                  </h3>
                  {visibleReflectSchool.map((q, qIdx) => {
                    const qId = getQuestionId(ep.number, 'rs', q, qIdx);
                    return (
                      <AnswerBlock
                        key={qId}
                        id={qId}
                        questionNumber={q.n}
                        prompt={getQuestionPrompt(q)}
                        answer={q.answer}
                        pullQuoteExcerpt={getQuestionPullquote(q)}
                        forceExpanded={true}
                      />
                    );
                  })}
                </div>
              )}

              {/* Delivered Episode 02: Personal Illustration */}
              {ep.personalIllustration && (
                <div className="space-y-[var(--space-12)] break-inside-avoid">
                  <h3 className="font-display font-bold text-scale-20">
                    Personal illustration of an ideal school environment
                  </h3>
                  {ep.personalIllustration.format && (
                    <p
                      data-verify-id={`${epId}-illustration-format`}
                      className="font-mono text-scale-12 font-semibold text-[var(--color-chalk-muted)]"
                    >
                      {ep.personalIllustration.format}
                    </p>
                  )}
                  <AutoPhotoFrame
                    assetKey={ep.personalIllustration.image}
                    captionOverride={ep.personalIllustration.caption}
                    verifyIdOverride={`${epId}-illustration-caption`}
                    shape="plain"
                    treatment="none"
                  />
                </div>
              )}

              {/* Remaining Episode Photo Artifacts */}
              {remainingPhotos.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--space-16)]">
                  {remainingPhotos.map((photo) => (
                    <AutoPhotoFrame
                      key={photo.cleanKey}
                      photo={photo}
                      shape="plain"
                      treatment="none"
                    />
                  ))}
                </div>
              )}

              {/* Delivered Episode 02: Psychosocial Checklist (with Red-Pen Stamps) */}
              {psyData.items.length > 0 && (
                <div className="space-y-[var(--space-16)]">
                  <h3
                    data-verify-id={psyData.title ? `${epId}-psychosocialChecklist-title` : undefined}
                    className="font-display font-bold text-scale-20"
                  >
                    {psyData.title || 'Psychosocial Environment Checklist'}
                  </h3>
                  <table className="w-full border-collapse text-left text-scale-14 border-2 border-[var(--color-ink)]">
                    <thead>
                      <tr className="border-b-2 border-[var(--color-ink)] bg-[var(--color-chalk)]">
                        <th className="p-[var(--space-8)] border-r border-[var(--color-ink)]">
                          Psychosocial indicator
                        </th>
                        <th className="p-[var(--space-8)] text-center">Red-pen observation stamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {psyData.items.map((item, iIdx) => {
                        const itemId = `${epId}-psy-${iIdx + 1}`;
                        const itemText = getPsychosocialItemText(item);
                        const isObs = Boolean(item.observed);
                        return (
                          <tr
                            key={itemId}
                            className="border-b border-[var(--color-border-light)] align-top"
                          >
                            <th className="p-[var(--space-8)] border-r border-[var(--color-ink)] font-medium">
                              <span data-verify-id={`${itemId}-text`}>{itemText}</span>
                            </th>
                            <td className="p-[var(--space-8)] text-center font-mono font-bold">
                              <span
                                data-verify-id={`${itemId}-observed`}
                                data-verify-observed={String(isObs)}
                                className="sr-only"
                              >
                                {String(isObs)}
                              </span>
                              <span
                                aria-hidden="true"
                                data-verify-source={String(isObs)}
                                className="inline-flex items-center gap-[var(--space-6)] px-[var(--space-8)] py-[2px] border border-[var(--color-red-pen)] text-[var(--color-red-pen)] font-mono text-scale-12 font-bold"
                              >
                                <span>{isObs ? '✓ OBSERVED' : '✕ Not observed'}</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Delivered Episode 02: Psychosocial Reflection */}
              {visiblePsychosocialReflect.length > 0 && (
                <div className="space-y-[var(--space-16)]">
                  <h3 className="font-display font-bold text-scale-20">
                    Psychosocial environment reflection
                  </h3>
                  {visiblePsychosocialReflect.map((q, qIdx) => {
                    const qId = getQuestionId(ep.number, 'pr', q, qIdx);
                    return (
                      <AnswerBlock
                        key={qId}
                        id={qId}
                        questionNumber={q.n}
                        prompt={getQuestionPrompt(q)}
                        answer={q.answer}
                        pullQuoteExcerpt={getQuestionPullquote(q)}
                        forceExpanded={true}
                      />
                    );
                  })}
                </div>
              )}

              {/* Delivered Episode 03 & 04: Activity 1 */}
              {ep.activity1 && (
                <div
                  id={`${epShort}-act${ep.activity1.number}`}
                  className="space-y-[var(--space-20)] pt-[var(--space-16)] border-t border-[var(--color-ink)]"
                >
                  <div className="space-y-[var(--space-4)]">
                    {ep.activity1.title ? (
                      <>
                        <span className="font-mono text-scale-12 font-bold">
                          Activity {ep.activity1.number}
                        </span>
                        <h3
                          data-verify-id={`${epId}-act1-title`}
                          className="font-display font-bold text-scale-24"
                        >
                          {ep.activity1.title}
                        </h3>
                      </>
                    ) : (
                      <h3 className="font-display font-bold text-scale-24">
                        Activity {ep.activity1.number}
                      </h3>
                    )}
                  </div>

                  {ep.activity1.routinesTable && (
                    <div className="space-y-[var(--space-8)]">
                      <table className="w-full border-collapse text-left text-scale-14 border-2 border-[var(--color-ink)]">
                        <thead>
                          <tr className="border-b-2 border-[var(--color-ink)] bg-[var(--color-chalk)]">
                            {ep.activity1.routinesTable.columns.map((col, cIdx) => (
                              <th
                                key={col.key}
                                data-verify-id={`${epId}-routinesTable-col-${col.key}`}
                                className={`p-[var(--space-8)] ${
                                  cIdx === 0 ? 'border-r border-[var(--color-ink)]' : 'text-center'
                                }`}
                              >
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {ep.activity1.routinesTable.rows.map((row, rIdx) => {
                            const rowPathKey = `${epId}.activity1.routinesTable.rows[${rIdx}]`;
                            if (hidePending && isStatusPending(undefined, rowPathKey)) return null;
                            const symbol = formatObservationStatusSymbol(row.status);
                            return (
                              <tr
                                key={rowPathKey}
                                className="border-b border-[var(--color-border-light)] align-top"
                              >
                                <th
                                  scope="row"
                                  data-verify-id={`${rowPathKey}.routine`}
                                  className="p-[var(--space-8)] border-r border-[var(--color-ink)] font-semibold"
                                >
                                  {row.routine}
                                </th>
                                <td className="p-[var(--space-8)] text-center font-bold">
                                  <span
                                    data-verify-id={`${rowPathKey}.status`}
                                    data-verify-status={row.status}
                                  >
                                    {symbol}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {ep.activity1.questions && ep.activity1.questions.length > 0 && (
                    <div className="space-y-[var(--space-12)]">
                      {ep.activity1.questions.map((q, qIdx) => {
                        const pathKey = `${epId}.activity1.questions[${qIdx}]`;
                        if (hidePending && isStatusPending(q.status, pathKey)) return null;
                        const verifyId = `${epId}-act1-q${q.n ?? qIdx + 1}`;
                        const domId = `${epShort}-act${ep.activity1!.number}-q${q.n ?? qIdx + 1}`;
                        return (
                          <AnswerBlock
                            key={verifyId}
                            id={domId}
                            verifyId={verifyId}
                            questionNumber={q.n}
                            prompt={getQuestionPrompt(q)}
                            answer={q.answer}
                            pullQuoteExcerpt={getQuestionPullquote(q)}
                            forceExpanded={true}
                          />
                        );
                      })}
                    </div>
                  )}

                  {ep.activity1.learnersObserved && (
                    <div className="space-y-[var(--space-12)]">
                      <div className="flex flex-wrap items-center justify-between gap-[var(--space-8)]">
                        <h4
                          data-verify-id={`${epId}-learnersObserved-title`}
                          className="font-display font-bold text-scale-20"
                        >
                          {ep.activity1.learnersObserved.title}
                        </h4>
                        {ep.activity1.learnersObserved.gradeSection && (
                          <span
                            data-verify-id={`${epId}-learnersObserved-gradeSection`}
                            className="font-mono text-scale-12 font-bold"
                          >
                            {ep.activity1.learnersObserved.gradeSection}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--space-12)]">
                        {ep.activity1.learnersObserved.rows.map((learner, lIdx) => {
                          const rowPathKey = `${epId}.activity1.learnersObserved.rows[${lIdx}]`;
                          if (hidePending && isStatusPending(learner.status, rowPathKey)) {
                            return null;
                          }
                          const lId = `${epId}-learner-${lIdx}`;
                          return (
                            <div
                              key={learner.code}
                              className="p-[var(--space-16)] shape-index-card-plain space-y-[var(--space-8)] break-inside-avoid"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-[var(--space-8)]">
                                <div className="flex items-center gap-[var(--space-8)]">
                                  <strong
                                    data-verify-id={`${lId}-code`}
                                    className="font-mono text-scale-14 font-bold"
                                  >
                                    {learner.code}
                                  </strong>
                                  <span
                                    data-verify-id={`${lId}-group`}
                                    className="font-semibold text-scale-14"
                                  >
                                    {learner.group}
                                  </span>
                                </div>
                                {(learner.age !== undefined || learner.gender !== undefined) && (
                                  <div className="flex items-center gap-[var(--space-8)] font-mono text-scale-12">
                                    {learner.age !== undefined && (
                                      <span>
                                        Age:{' '}
                                        <strong data-verify-id={`${lId}-age`}>{learner.age}</strong>
                                      </span>
                                    )}
                                    {learner.gender !== undefined && (
                                      <span>
                                        Gender:{' '}
                                        <strong data-verify-id={`${lId}-gender`}>
                                          {learner.gender}
                                        </strong>
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <p
                                data-verify-id={`${lId}-description`}
                                className="text-scale-14"
                              >
                                {learner.description}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {ep.activity1.interviewGuide && (
                    <div className="space-y-[var(--space-12)]">
                      <h4
                        data-verify-id={`${epId}-interviewGuide-title`}
                        className="font-display font-bold text-scale-20"
                      >
                        {ep.activity1.interviewGuide.title}
                      </h4>
                      {ep.activity1.interviewGuide.questions.map((q, qIdx) => {
                        const pathKey = `${epId}.activity1.interviewGuide.questions[${qIdx}]`;
                        if (hidePending && isStatusPending(q.status, pathKey)) return null;
                        const verifyId = `${epId}-act1-ig-q${q.n ?? qIdx + 1}`;
                        const domId = `${epShort}-act${ep.activity1!.number}-ig-q${q.n ?? qIdx + 1}`;
                        return (
                          <AnswerBlock
                            key={verifyId}
                            id={domId}
                            verifyId={verifyId}
                            questionNumber={q.n}
                            prompt={getQuestionPrompt(q)}
                            answer={q.answer}
                            pullQuoteExcerpt={getQuestionPullquote(q)}
                            forceExpanded={true}
                          />
                        );
                      })}
                    </div>
                  )}

                  {ep.activity1.answer && (
                    <div className="space-y-[var(--space-12)]">
                      <h4
                        data-verify-id={`${epId}-act1-answer-title`}
                        className="font-display font-bold text-scale-20"
                      >
                        {ep.activity1.answer.title}
                      </h4>
                      {ep.activity1.answer.questions.map((q, qIdx) => {
                        const pathKey = `${epId}.activity1.answer.questions[${qIdx}]`;
                        if (hidePending && isStatusPending(q.status, pathKey)) return null;
                        const verifyId = `${epId}-act1-ans-q${q.n ?? qIdx + 1}`;
                        const domId = `${epShort}-act${ep.activity1!.number}-q${q.n ?? qIdx + 1}`;
                        return (
                          <AnswerBlock
                            key={verifyId}
                            id={domId}
                            verifyId={verifyId}
                            questionNumber={q.n}
                            prompt={getQuestionPrompt(q)}
                            answer={q.answer}
                            pullQuoteExcerpt={getQuestionPullquote(q)}
                            forceExpanded={true}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Delivered Episode 03 & 04: Activity 2 */}
              {ep.activity2 && (
                <div
                  id={`${epShort}-act${ep.activity2.number}`}
                  className="space-y-[var(--space-20)] pt-[var(--space-16)] border-t border-[var(--color-ink)]"
                >
                  {ep.number === '04' ? (
                    <h3 className="font-display font-bold text-scale-24">
                      Activity {ep.activity2.number}:{' '}
                      <span data-verify-id={`${epId}-act2-title`}>{ep.activity2.title}</span>
                    </h3>
                  ) : (
                    <div className="space-y-[var(--space-4)]">
                      <div className="flex flex-wrap items-center gap-[var(--space-8)]">
                        <span className="font-mono text-scale-12 font-bold">
                          Activity {ep.activity2.number}
                        </span>
                        {ep.activity2.note && (
                          <span
                            data-verify-id={`${epId}-act2-note`}
                            className="font-mono text-scale-12"
                          >
                            {ep.activity2.note}
                          </span>
                        )}
                      </div>
                      <h3
                        data-verify-id={`${epId}-act2-title`}
                        className="font-display font-bold text-scale-24"
                      >
                        {ep.activity2.title}
                      </h3>
                    </div>
                  )}

                  {ep.activity2.strategiesTable && (
                    <div className="space-y-[var(--space-8)]">
                      <table className="w-full border-collapse text-left text-scale-14 border-2 border-[var(--color-ink)]">
                        <thead>
                          <tr className="border-b-2 border-[var(--color-ink)] bg-[var(--color-chalk)]">
                            {ep.activity2.strategiesTable.columns.map((col, cIdx) => (
                              <th
                                key={col.key}
                                data-verify-id={`${epId}-strategiesTable-col-${col.key}`}
                                className={`p-[var(--space-8)] ${
                                  cIdx < 2 ? 'border-r border-[var(--color-ink)]' : ''
                                } ${cIdx === 1 ? 'text-center' : ''}`}
                              >
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {ep.activity2.strategiesTable.rows.map((row, rIdx) => {
                            const rowPathKey = `${epId}.activity2.strategiesTable.rows[${rIdx}]`;
                            if (hidePending && isStatusPending(undefined, rowPathKey)) return null;
                            const symbol = formatObservationStatusSymbol(row.status);
                            return (
                              <tr
                                key={rowPathKey}
                                className="border-b border-[var(--color-border-light)] align-top"
                              >
                                <th
                                  scope="row"
                                  data-verify-id={`${rowPathKey}.strategy`}
                                  className="p-[var(--space-8)] border-r border-[var(--color-ink)] font-semibold"
                                >
                                  {row.strategy}
                                </th>
                                <td className="p-[var(--space-8)] border-r border-[var(--color-ink)] text-center font-bold">
                                  <span
                                    data-verify-id={`${rowPathKey}.status`}
                                    data-verify-status={row.status}
                                  >
                                    {symbol}
                                  </span>
                                </td>
                                <td className="p-[var(--space-8)]">
                                  {row.remarks !== undefined && row.remarks !== '' && (
                                    <span data-verify-id={`${rowPathKey}.remarks`}>
                                      {renderAsteriskEmphasis(row.remarks)}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {ep.activity2.rtInterview && (
                    <div className="space-y-[var(--space-12)]">
                      <h4
                        data-verify-id={`${epId}-rtInterview-title`}
                        className="font-display font-bold text-scale-20"
                      >
                        {ep.activity2.rtInterview.title}
                      </h4>

                      {ep.activity2.rtInterview.profile && (
                        <div className="p-[var(--space-12)] shape-index-card-plain grid grid-cols-1 sm:grid-cols-3 gap-[var(--space-8)] text-scale-14">
                          {[
                            { key: 'nameOfResourceTeacher', label: 'Name of Resource Teacher' },
                            { key: 'gradeLevelSubject', label: 'Grade Level / Subject' },
                            { key: 'dateOfInterview', label: 'Date of Interview' },
                            { key: 'yearsInService', label: 'Years in Service' },
                          ].map(({ key, label }) => {
                            const rawVal = (
                              ep.activity2?.rtInterview?.profile as Record<string, unknown>
                            )?.[key];
                            if (rawVal === undefined || rawVal === null) return null;
                            const pathKey = `${epId}.activity2.rtInterview.profile.${key}`;
                            const inlineStatus =
                              typeof rawVal === 'object' && rawVal !== null && 'status' in rawVal
                                ? (rawVal as { status?: string }).status
                                : undefined;
                            const valStr =
                              typeof rawVal === 'object' && rawVal !== null && 'value' in rawVal
                                ? String((rawVal as { value?: string }).value ?? '')
                                : String(rawVal);
                            if (hidePending && isStatusPending(inlineStatus, pathKey)) return null;
                            if (isStatusPending(inlineStatus, pathKey)) return null;
                            return (
                              <div key={key}>
                                <span className="font-mono text-scale-12 block">{label}</span>
                                <strong data-verify-id={`${epId}-rti-profile-${key}`}>
                                  {valStr}
                                </strong>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {ep.activity2.rtInterview.questions.map((q, qIdx) => {
                        const pathKey = `${epId}.activity2.rtInterview.questions[${qIdx}]`;
                        if (hidePending && isStatusPending(q.status, pathKey)) return null;
                        const verifyId = `${epId}-act2-rti-q${q.n ?? qIdx + 1}`;
                        const domId = `${epShort}-act${ep.activity2!.number}-rti-q${q.n ?? qIdx + 1}`;
                        const useFullAttribution =
                          ep.activity2?.rtInterview?.attribution === 'full'
                            ? ep.activity2.rtInterview.profile
                            : undefined;
                        return (
                          <AnswerBlock
                            key={verifyId}
                            id={domId}
                            verifyId={verifyId}
                            questionNumber={q.n}
                            prompt={getQuestionPrompt(q)}
                            answer={q.answer}
                            pullQuoteExcerpt={getQuestionPullquote(q)}
                            forceExpanded={true}
                            quoteAttribution={useFullAttribution}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Episode 04 Observation Sheet */}
                  {ep.activity2.observationSheet && (
                    <div className="p-[var(--space-16)] shape-index-card-plain grid grid-cols-1 sm:grid-cols-2 gap-[var(--space-8)] text-scale-14">
                      {[
                        { key: 'nameOfTeacher', label: 'Name of Teacher' },
                        { key: 'school', label: 'School' },
                        { key: 'date', label: 'Date' },
                        { key: 'sessions', label: 'Sessions' },
                        { key: 'gradeLevel', label: 'Grade Level' },
                        { key: 'subjectArea', label: 'Subject Area' },
                      ].map(({ key, label }) => {
                        const rawField = ep.activity2?.observationSheet?.[key];
                        if (rawField === undefined || rawField === null) return null;
                        const pathKey = `${epId}.activity2.observationSheet.${key}`;
                        const inlineStatus =
                          typeof rawField === 'object' && 'status' in rawField
                            ? rawField.status
                            : undefined;
                        const val =
                          typeof rawField === 'object' && 'value' in rawField
                            ? String(rawField.value ?? '')
                            : String(rawField);
                        if (hidePending && isStatusPending(inlineStatus, pathKey)) {
                          return null;
                        }
                        if (isStatusPending(inlineStatus, pathKey)) {
                          return null;
                        }
                        return (
                          <div key={key}>
                            <strong>{label}: </strong>
                            <span data-verify-id={`${epId}-obs-${key}`}>{val}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Episode 04 Activity 2-1 */}
                  {ep.activity2.activity2_1 && (
                    <div
                      id={`${epShort}-act${ep.activity2.activity2_1.number}`}
                      className="space-y-[var(--space-12)]"
                    >
                      <div>
                        <span className="font-display font-bold text-scale-20 block">
                          {ep.activity2.activity2_1.number}
                        </span>
                        <h4
                          data-verify-id={`${epId}-act2_1-title`}
                          className="font-display font-bold text-scale-17 text-[var(--color-chalk-muted)]"
                        >
                          {ep.activity2.activity2_1.title}
                        </h4>
                      </div>

                      {ep.activity2.activity2_1.methodsTable && (
                        <table className="w-full border-collapse text-left text-scale-14 border-2 border-[var(--color-ink)]">
                          <thead>
                            <tr className="border-b-2 border-[var(--color-ink)] bg-[var(--color-chalk)]">
                              {ep.activity2.activity2_1.methodsTable.columns.map((col, cIdx) => (
                                <th
                                  key={col.key}
                                  data-verify-id={`${epId}-methodsTable-col-${col.key}`}
                                  className={`p-[var(--space-8)] ${
                                    cIdx === 0 ? 'border-r border-[var(--color-ink)]' : ''
                                  }`}
                                >
                                  {col.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {ep.activity2.activity2_1.methodsTable.rows.map((row, rIdx) => {
                              const rowPathKey = `${epId}.activity2.activity2_1.methodsTable.rows[${rIdx}]`;
                              if (hidePending && isStatusPending(row.status, rowPathKey)) {
                                return null;
                              }
                              return (
                                <tr
                                  key={rowPathKey}
                                  className="border-b border-[var(--color-border-light)] align-top"
                                >
                                  <th
                                    scope="row"
                                    data-verify-id={`${rowPathKey}.method`}
                                    className="p-[var(--space-8)] border-r border-[var(--color-ink)] font-semibold"
                                  >
                                    {row.method}
                                  </th>
                                  <td
                                    data-verify-id={`${rowPathKey}.description`}
                                    className="p-[var(--space-8)]"
                                  >
                                    {renderAsteriskEmphasis(row.description)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}

                      {ep.activity2.activity2_1.questions &&
                        ep.activity2.activity2_1.questions.map((q, qIdx) => {
                          const pathKey = `${epId}.activity2.activity2_1.questions[${qIdx}]`;
                          if (hidePending && isStatusPending(q.status, pathKey)) return null;
                          const verifyId = `${epId}-act2_1-q${q.n ?? qIdx + 1}`;
                          const domId = `${epShort}-act${ep.activity2!.activity2_1!.number}-q${q.n ?? qIdx + 1}`;
                          return (
                            <AnswerBlock
                              key={verifyId}
                              id={domId}
                              verifyId={verifyId}
                              questionNumber={q.n}
                              prompt={getQuestionPrompt(q)}
                              answer={q.answer}
                              pullQuoteExcerpt={getQuestionPullquote(q)}
                              forceExpanded={true}
                            />
                          );
                        })}
                    </div>
                  )}

                  {/* Episode 04 Activity 2-2 */}
                  {ep.activity2.activity2_2 && (
                    <div
                      id={`${epShort}-act${ep.activity2.activity2_2.number}`}
                      className="space-y-[var(--space-12)]"
                    >
                      <div>
                        <span className="font-display font-bold text-scale-20 block">
                          {ep.activity2.activity2_2.number}
                        </span>
                        <h4
                          data-verify-id={`${epId}-act2_2-title`}
                          className="font-display font-bold text-scale-17 text-[var(--color-chalk-muted)]"
                        >
                          {ep.activity2.activity2_2.title}
                        </h4>
                      </div>

                      {ep.activity2.activity2_2.materialsTable && (
                        <table className="w-full border-collapse text-left text-scale-14 border-2 border-[var(--color-ink)]">
                          <thead>
                            <tr className="border-b-2 border-[var(--color-ink)] bg-[var(--color-chalk)]">
                              {ep.activity2.activity2_2.materialsTable.columns.map((col, cIdx) => (
                                <th
                                  key={col.key}
                                  data-verify-id={`${epId}-materialsTable-col-${col.key}`}
                                  className={`p-[var(--space-8)] ${
                                    cIdx < 2 ? 'border-r border-[var(--color-ink)]' : ''
                                  } ${cIdx === 1 ? 'text-center' : ''}`}
                                >
                                  {col.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {ep.activity2.activity2_2.materialsTable.rows.map((row, rIdx) => {
                              const rowPathKey = `${epId}.activity2.activity2_2.materialsTable.rows[${rIdx}]`;
                              if (hidePending && isStatusPending(row.status, rowPathKey)) {
                                return null;
                              }
                              const isPresent = Boolean(row.present);
                              return (
                                <tr
                                  key={rowPathKey}
                                  className="border-b border-[var(--color-border-light)] align-top"
                                >
                                  <th
                                    scope="row"
                                    data-verify-id={`${rowPathKey}.material`}
                                    className="p-[var(--space-8)] border-r border-[var(--color-ink)] font-semibold"
                                  >
                                    {row.material}
                                  </th>
                                  <td className="p-[var(--space-8)] border-r border-[var(--color-ink)] text-center font-mono font-bold">
                                    <span
                                      data-verify-id={`${rowPathKey}.present`}
                                      data-verify-present={String(isPresent)}
                                    >
                                      {isPresent ? '✓' : '✕'}
                                    </span>
                                  </td>
                                  <td className="p-[var(--space-8)]">
                                    {row.notes !== undefined && (
                                      <span data-verify-id={`${rowPathKey}.notes`}>
                                        {renderAsteriskEmphasis(row.notes)}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}

                      {ep.activity2.activity2_2.questions &&
                        ep.activity2.activity2_2.questions.map((q, qIdx) => {
                          const pathKey = `${epId}.activity2.activity2_2.questions[${qIdx}]`;
                          if (hidePending && isStatusPending(q.status, pathKey)) return null;
                          const verifyId = `${epId}-act2_2-q${q.n ?? qIdx + 1}`;
                          const domId = `${epShort}-act${ep.activity2!.activity2_2!.number}-q${q.n ?? qIdx + 1}`;
                          return (
                            <AnswerBlock
                              key={verifyId}
                              id={domId}
                              verifyId={verifyId}
                              questionNumber={q.n}
                              prompt={getQuestionPrompt(q)}
                              answer={q.answer}
                              pullQuoteExcerpt={getQuestionPullquote(q)}
                              forceExpanded={true}
                            />
                          );
                        })}
                    </div>
                  )}

                  {/* Episode 04 Activity 2-3 */}
                  {ep.activity2.activity2_3 && (
                    <div
                      id={`${epShort}-act${ep.activity2.activity2_3.number}`}
                      className="space-y-[var(--space-12)]"
                    >
                      <div>
                        <span className="font-display font-bold text-scale-20 block">
                          {ep.activity2.activity2_3.number}
                        </span>
                        <h4
                          data-verify-id={`${epId}-act2_3-title`}
                          className="font-display font-bold text-scale-17 text-[var(--color-chalk-muted)]"
                        >
                          {ep.activity2.activity2_3.title}
                        </h4>
                      </div>

                      {ep.activity2.activity2_3.questions &&
                        ep.activity2.activity2_3.questions.map((q, qIdx) => {
                          const pathKey = `${epId}.activity2.activity2_3.questions[${qIdx}]`;
                          if (hidePending && isStatusPending(q.status, pathKey)) return null;
                          const verifyId = `${epId}-act2_3-q${q.n ?? qIdx + 1}`;
                          const domId = `${epShort}-act${ep.activity2!.activity2_3!.number}-q${q.n ?? qIdx + 1}`;
                          return (
                            <AnswerBlock
                              key={verifyId}
                              id={domId}
                              verifyId={verifyId}
                              questionNumber={q.n}
                              prompt={getQuestionPrompt(q)}
                              answer={q.answer}
                              pullQuoteExcerpt={getQuestionPullquote(q)}
                              forceExpanded={true}
                            />
                          );
                        })}
                    </div>
                  )}

                  {ep.activity2.classObservation && (
                    <div className="space-y-[var(--space-12)]">
                      <h4
                        data-verify-id={`${epId}-classObservation-title`}
                        className="font-display font-bold text-scale-20"
                      >
                        {ep.activity2.classObservation.title}
                      </h4>
                      {ep.activity2.classObservation.guideTitle && (
                        <p
                          data-verify-id={`${epId}-classObservation-guideTitle`}
                          className="font-mono text-scale-12 text-[var(--color-chalk-muted)]"
                        >
                          {ep.activity2.classObservation.guideTitle}
                        </p>
                      )}
                      {ep.activity2.classObservation.questions.map((q, qIdx) => {
                        const pathKey = `${epId}.activity2.classObservation.questions[${qIdx}]`;
                        if (hidePending && isStatusPending(q.status, pathKey)) return null;
                        const verifyId = `${epId}-act2-co-q${q.n ?? qIdx + 1}`;
                        const domId = `${epShort}-act${ep.activity2!.number}-co-q${q.n ?? qIdx + 1}`;
                        return (
                          <AnswerBlock
                            key={verifyId}
                            id={domId}
                            verifyId={verifyId}
                            questionNumber={q.n}
                            prompt={getQuestionPrompt(q)}
                            answer={q.answer}
                            pullQuoteExcerpt={getQuestionPullquote(q)}
                            forceExpanded={true}
                          />
                        );
                      })}
                    </div>
                  )}

                  {ep.activity2.teacherInterview && (
                    <div className="space-y-[var(--space-16)]">
                      <h4
                        data-verify-id={`${epId}-teacherInterview-title`}
                        className="font-display font-bold text-scale-20"
                      >
                        {ep.activity2.teacherInterview.title}
                      </h4>

                      {ep.activity2.teacherInterview.profile && (
                        <div className="p-[var(--space-16)] shape-index-card-plain grid grid-cols-1 sm:grid-cols-2 gap-[var(--space-8)] text-scale-14">
                          <div>
                            <strong>Resource Teacher: </strong>
                            <span data-verify-id={`${epId}-ti-profile-resourceTeacher`}>
                              {ep.activity2.teacherInterview.profile.resourceTeacher}
                            </span>
                          </div>
                          <div>
                            <strong>School: </strong>
                            <span data-verify-id={`${epId}-ti-profile-school`}>
                              {ep.activity2.teacherInterview.profile.school}
                            </span>
                          </div>
                          <div>
                            <strong>Grade Level / Subject: </strong>
                            <span data-verify-id={`${epId}-ti-profile-gradeLevelSubject`}>
                              {ep.activity2.teacherInterview.profile.gradeLevelSubject}
                            </span>
                          </div>
                          <div>
                            <strong>Date of Interview: </strong>
                            <span data-verify-id={`${epId}-ti-profile-dateOfInterview`}>
                              {ep.activity2.teacherInterview.profile.dateOfInterview}
                            </span>
                          </div>
                        </div>
                      )}

                      {ep.activity2.teacherInterview.parts.map((part, pIdx) => {
                        const useFullAttribution =
                          ep.activity2?.teacherInterview?.attribution === 'full'
                            ? ep.activity2.teacherInterview.profile
                            : undefined;

                        return (
                          <div key={`print-ti-part-${pIdx}`} className="space-y-[var(--space-12)]">
                            <h5
                              data-verify-id={`${epId}-ti-part-${pIdx + 1}-heading`}
                              className="font-display font-bold text-scale-17"
                            >
                              {part.heading}
                            </h5>
                            {part.questions.map((q, qIdx) => {
                              const pathKey = `${epId}.activity2.teacherInterview.parts[${pIdx}].questions[${qIdx}]`;
                              if (hidePending && isStatusPending(q.status, pathKey)) return null;
                              const verifyId = `${epId}-act2-ti-p${pIdx + 1}-q${q.n ?? qIdx + 1}`;
                              const domId = `${epShort}-act${ep.activity2!.number}-ti-p${pIdx + 1}-q${q.n ?? qIdx + 1}`;
                              return (
                                <AnswerBlock
                                  key={verifyId}
                                  id={domId}
                                  verifyId={verifyId}
                                  questionNumber={q.n}
                                  prompt={getQuestionPrompt(q)}
                                  answer={q.answer}
                                  pullQuoteExcerpt={getQuestionPullquote(q)}
                                  forceExpanded={true}
                                  quoteAttribution={useFullAttribution}
                                />
                              );
                            })}
                          </div>
                        );
                      })}

                      {ep.activity2.teacherInterview.practicesTable && (
                        <div className="space-y-[var(--space-12)]">
                          <h5
                            data-verify-id={`${epId}-practicesTable-title`}
                            className="font-display font-bold text-scale-20"
                          >
                            {ep.activity2.teacherInterview.practicesTable.title}
                          </h5>
                          {ep.activity2.teacherInterview.practicesTable.instruction && (
                            <p
                              data-verify-id={`${epId}-practicesTable-instruction`}
                              className="text-scale-14 text-[var(--color-chalk-muted)]"
                            >
                              {ep.activity2.teacherInterview.practicesTable.instruction}
                            </p>
                          )}

                          <table className="w-full border-collapse text-left text-scale-14 border-2 border-[var(--color-ink)]">
                            <thead>
                              <tr className="border-b-2 border-[var(--color-ink)] bg-[var(--color-chalk)]">
                                {ep.activity2.teacherInterview.practicesTable.columns.map(
                                  (col, cIdx) => (
                                    <th
                                      key={col.key}
                                      data-verify-id={`${epId}-practicesTable-col-${col.key}`}
                                      className={`p-[var(--space-8)] ${
                                        cIdx === 0 ? 'border-r border-[var(--color-ink)]' : ''
                                      }`}
                                    >
                                      {col.label}
                                    </th>
                                  )
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {ep.activity2.teacherInterview.practicesTable.rows.map(
                                (row, rIdx) => {
                                  const rowPathKey = `${epId}.activity2.teacherInterview.practicesTable.rows[${rIdx}]`;
                                  const rowPending = isStatusPending(row.status, rowPathKey);
                                  if (rowPending && hidePending) return null;
                                  if (rowPending) return null;
                                  return (
                                    <tr
                                      key={rowPathKey}
                                      className="border-b border-[var(--color-border-light)] align-top"
                                    >
                                      <th
                                        scope="row"
                                        data-verify-id={`${rowPathKey}.practice`}
                                        className="p-[var(--space-8)] border-r border-[var(--color-ink)] font-semibold"
                                      >
                                        {row.practice}
                                      </th>
                                      <td
                                        data-verify-id={`${rowPathKey}.illustration`}
                                        className="p-[var(--space-8)]"
                                      >
                                        {row.illustration}
                                      </td>
                                    </tr>
                                  );
                                }
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {ep.activity2.answer && (
                    <div className="space-y-[var(--space-12)]">
                      <h4
                        data-verify-id={`${epId}-act2-answer-title`}
                        className="font-display font-bold text-scale-20"
                      >
                        {ep.activity2.answer.title}
                      </h4>
                      {ep.activity2.answer.questions.map((q, qIdx) => {
                        const pathKey = `${epId}.activity2.answer.questions[${qIdx}]`;
                        if (hidePending && isStatusPending(q.status, pathKey)) return null;
                        const verifyId = `${epId}-act2-ans-q${q.n ?? qIdx + 1}`;
                        const domId = `${epShort}-act${ep.activity2!.number}-q${q.n ?? qIdx + 1}`;
                        return (
                          <AnswerBlock
                            key={verifyId}
                            id={domId}
                            verifyId={verifyId}
                            questionNumber={q.n}
                            prompt={getQuestionPrompt(q)}
                            answer={q.answer}
                            pullQuoteExcerpt={getQuestionPullquote(q)}
                            forceExpanded={true}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Delivered Episode 04: Reflections */}
              {ep.reflections &&
                !(hidePending && isStatusPending(ep.reflections.status, `${epId}.reflections`)) && (
                  <div className="space-y-[var(--space-12)] pt-[var(--space-16)] border-t border-[var(--color-ink)]">
                    <h3
                      data-verify-id={`${epId}-reflections-title`}
                      className="font-display font-bold text-scale-24"
                    >
                      {ep.reflections.title}
                    </h3>
                    <AnswerBlock
                      id={`${epId}-reflections`}
                      prompt={ep.reflections.prompt}
                      answer={ep.reflections.answer}
                      pullQuoteExcerpt={ep.reflections.pullquote}
                      forceExpanded={true}
                    />
                  </div>
                )}

              {/* Delivered Episode 05: Activity 3 */}
              {ep.activity3 && (
                <div
                  id={`${epShort}-act${ep.activity3.number}`}
                  className="space-y-[var(--space-16)] pt-[var(--space-16)] border-t border-[var(--color-ink)]"
                >
                  <div className="space-y-[var(--space-4)]">
                    <span className="font-mono text-scale-12 font-bold">
                      Activity {ep.activity3.number}
                    </span>
                    {ep.activity3.title && (
                      <h3
                        data-verify-id={`${epId}-act3-title`}
                        className="font-display font-bold text-scale-24"
                      >
                        {ep.activity3.title}
                      </h3>
                    )}
                  </div>

                  {/* classroomDrawing hidden when PENDING */}
                  {ep.activity3.classroomDrawing &&
                    !isStatusPending(
                      ep.activity3.classroomDrawing.status,
                      `${epId}.activity3.classroomDrawing`
                    ) &&
                    ep.activity3.classroomDrawing.image && (
                      <figure className="p-[var(--space-16)] shape-index-card-plain">
                        <img
                          src={ep.activity3.classroomDrawing.image}
                          alt="Classroom layout drawing"
                          className="w-full h-auto"
                        />
                      </figure>
                    )}

                  {ep.activity3.answer && (
                    <div className="space-y-[var(--space-12)]">
                      <h4
                        data-verify-id={`${epId}-act3-answer-title`}
                        className="font-display font-bold text-scale-20"
                      >
                        {ep.activity3.answer.title}
                      </h4>
                      {ep.activity3.answer.questions.map((q, qIdx) => {
                        const pathKey = `${epId}.activity3.answer.questions[${qIdx}]`;
                        if (hidePending && isStatusPending(q.status, pathKey)) return null;
                        const verifyId = `${epId}-act3-ans-q${q.n ?? qIdx + 1}`;
                        const domId = `${epShort}-act${ep.activity3!.number}-q${q.n ?? qIdx + 1}`;
                        return (
                          <AnswerBlock
                            key={verifyId}
                            id={domId}
                            verifyId={verifyId}
                            questionNumber={q.n}
                            prompt={getQuestionPrompt(q)}
                            answer={q.answer}
                            pullQuoteExcerpt={getQuestionPullquote(q)}
                            forceExpanded={true}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Delivered Episode 01: Task 1, Task 2, Task 3 */}
              {ep.task1 && (
                <div
                  id={`${epShort}-task${ep.task1.number}`}
                  className="space-y-[var(--space-20)] pt-[var(--space-16)] border-t border-[var(--color-ink)]"
                >
                  <div className="space-y-[var(--space-4)]">
                    <span className="font-mono text-scale-12 font-bold">
                      Task {ep.task1.number}
                    </span>
                    <h3
                      data-verify-id={`${epId}-task1-title`}
                      className="font-display font-bold text-scale-24"
                    >
                      {ep.task1.title}
                    </h3>
                  </div>

                  {ep.task1.domains.map((dom, domIdx) => {
                    const domPrefix = `${epId}-task1-d${domIdx + 1}`;
                    return (
                      <div key={domPrefix} className="space-y-[var(--space-12)]">
                        <h4
                          data-verify-id={`${domPrefix}-heading`}
                          className="font-display font-bold text-scale-17"
                        >
                          {dom.heading}
                        </h4>

                        <table className="w-full border-collapse text-left text-scale-12 border-2 border-[var(--color-ink)]">
                          <thead>
                            <tr className="border-b-2 border-[var(--color-ink)] bg-[var(--color-chalk)] align-top">
                              <th className="p-[var(--space-8)] border-r border-[var(--color-ink)]">
                                Competency Indicators
                              </th>
                              {ep.task1!.levels.map((lvl, lvlIdx) => (
                                <th
                                  key={lvl.label}
                                  className="p-[var(--space-8)] border-r border-[var(--color-ink)]"
                                >
                                  <div
                                    data-verify-id={
                                      domIdx === 0
                                        ? `${epId}-task1-level-${lvlIdx + 1}-label`
                                        : undefined
                                    }
                                    className="font-bold"
                                  >
                                    {lvl.label}
                                  </div>
                                  <div
                                    data-verify-id={
                                      domIdx === 0
                                        ? `${epId}-task1-level-${lvlIdx + 1}-description`
                                        : undefined
                                    }
                                    className="font-normal text-[var(--color-chalk-muted)]"
                                  >
                                    {lvl.description}
                                  </div>
                                </th>
                              ))}
                              <th className="p-[var(--space-8)]">Evidence</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dom.indicators.map((ind, indIdx) => {
                              const indPrefix = `${domPrefix}-ind${indIdx + 1}`;
                              return (
                                <tr
                                  key={indPrefix}
                                  className="border-b border-[var(--color-border-light)] align-top"
                                >
                                  <th
                                    scope="row"
                                    className="p-[var(--space-8)] border-r border-[var(--color-ink)] font-normal"
                                  >
                                    <span data-verify-id={`${indPrefix}-text`}>
                                      {renderAsteriskEmphasis(ind.indicator)}
                                    </span>
                                  </th>
                                  {ep.task1!.levels.map((lvl) => {
                                    const isMatch = ind.level === lvl.label;
                                    return (
                                      <td
                                        key={lvl.label}
                                        className="p-[var(--space-8)] border-r border-[var(--color-ink)] text-center font-mono font-bold align-middle"
                                      >
                                        {isMatch ? (
                                          <span
                                            data-verify-id={`${indPrefix}-level`}
                                            data-verify-status={ind.level}
                                          >
                                            ✓
                                          </span>
                                        ) : null}
                                      </td>
                                    );
                                  })}
                                  <td className="p-[var(--space-8)] space-y-[var(--space-4)]">
                                    {ind.evidence.map((ev, evIdx) => {
                                      const isInternal = ev.url.startsWith('#');
                                      const linkText = ev.label || 'Open evidence';
                                      return (
                                        <div key={evIdx}>
                                          <a
                                            href={ev.url}
                                            target={isInternal ? undefined : '_blank'}
                                            rel={isInternal ? undefined : 'noopener'}
                                            data-verify-id={
                                              ev.label
                                                ? `${indPrefix}-ev${evIdx + 1}-label`
                                                : undefined
                                            }
                                            className="underline underline-offset-4 break-words"
                                          >
                                            {linkText}
                                          </a>
                                        </div>
                                      );
                                    })}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>

                        <div className="space-y-[var(--space-4)] text-scale-14">
                          <p>
                            <strong>Indicators that are not yet achieved: </strong>
                            <span data-verify-id={`${domPrefix}-notYetAchieved`}>
                              {dom.notYetAchieved}
                            </span>
                          </p>
                          <p>
                            <strong>Remarks/Insights: </strong>
                            <span data-verify-id={`${domPrefix}-remarks`}>{dom.remarks}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {ep.task2 &&
                !(
                  hidePending &&
                  ep.task2.roadmap &&
                  isStatusPending(ep.task2.roadmap.status, `${epId}.task2.roadmap`)
                ) && (
                  <div
                    id={`${epShort}-task${ep.task2.number}`}
                    className="space-y-[var(--space-12)] pt-[var(--space-16)] border-t border-[var(--color-ink)]"
                  >
                    <div className="space-y-[var(--space-4)]">
                      <span className="font-mono text-scale-12 font-bold">
                        Task {ep.task2.number}
                      </span>
                      <h3 className="font-display font-bold text-scale-24">
                        {ep.task2.title}
                      </h3>
                    </div>
                  </div>
                )}

              {ep.task3 && (
                <div
                  id={`${epShort}-task${ep.task3.number}-section`}
                  className="space-y-[var(--space-20)] pt-[var(--space-16)] border-t border-[var(--color-ink)]"
                >
                  <div className="space-y-[var(--space-4)]">
                    <span className="font-mono text-scale-12 font-bold">
                      Task {ep.task3.number}
                    </span>
                    <h3
                      data-verify-id={`${epId}-task3-title`}
                      className="font-display font-bold text-scale-24"
                    >
                      {ep.task3.title}
                    </h3>
                  </div>

                  {ep.task3.philosophiesTable && (
                    <table className="w-full border-collapse text-left text-scale-14 border-2 border-[var(--color-ink)]">
                      <thead>
                        <tr className="border-b-2 border-[var(--color-ink)] bg-[var(--color-chalk)] align-top">
                          {ep.task3.philosophiesTable.columns.map((col, cIdx) => (
                            <th
                              key={col.key}
                              data-verify-id={`${epId}-task3-phil-col-${col.key}`}
                              className={`p-[var(--space-8)] ${
                                cIdx < ep.task3!.philosophiesTable.columns.length - 1
                                  ? 'border-r border-[var(--color-ink)]'
                                  : ''
                              }`}
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ep.task3.philosophiesTable.rows.map((row, rIdx) => {
                          const rowId = `${epId}-task3-phil-r${rIdx + 1}`;
                          return (
                            <tr
                              key={rowId}
                              className="border-b border-[var(--color-border-light)] align-top"
                            >
                              <th
                                scope="row"
                                className="p-[var(--space-8)] border-r border-[var(--color-ink)] font-normal space-y-[var(--space-4)]"
                              >
                                {row.category && (
                                  <p
                                    data-verify-id={`${rowId}-category`}
                                    className="font-mono text-scale-12 font-bold text-[var(--color-chalk-muted)]"
                                  >
                                    {row.category}
                                  </p>
                                )}
                                <p
                                  data-verify-id={`${rowId}-philosophy`}
                                  className="font-bold text-scale-14"
                                >
                                  {row.philosophy}
                                </p>
                                <p data-verify-id={`${rowId}-definition`} className="text-scale-14">
                                  {renderAsteriskEmphasis(row.definition)}
                                </p>
                              </th>
                              <td
                                data-verify-id={`${rowId}-deped`}
                                className="p-[var(--space-8)] border-r border-[var(--color-ink)]"
                              >
                                {renderAsteriskEmphasis(row.deped)}
                              </td>
                              <td data-verify-id={`${rowId}-k12`} className="p-[var(--space-8)]">
                                {renderAsteriskEmphasis(row.k12)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {ep.task3.credo && (
                    <div id="ep1-task3" className="space-y-[var(--space-24)]">
                      <div className="border-b-2 border-[var(--color-ink)] pb-[var(--space-12)] space-y-[var(--space-8)]">
                        <h4
                          data-verify-id={`${epId}-credo-title`}
                          className="font-display font-bold text-scale-28"
                        >
                          {ep.task3.credo.title}
                        </h4>
                        {ep.themeQuote && (
                          <p className="font-display font-black italic text-scale-40 leading-tight text-[var(--color-ink)]">
                            “{ep.themeQuote}”
                          </p>
                        )}
                      </div>

                      <div className="space-y-[var(--space-24)]">
                        {ep.task3.credo.sections.map((sec, sIdx) => {
                          const secId = `${epId}-credo-s${sIdx + 1}`;
                          const roman = ['I', 'II', 'III', 'IV'][sIdx] || String(sIdx + 1);
                          const hasAudiences = Boolean(sec.audiences && sec.audiences.length > 0);

                          return (
                            <section
                              key={secId}
                              className="credo-print-section break-before-page break-inside-avoid p-[var(--space-24)] border-2 border-[var(--color-ink)] space-y-[var(--space-24)]"
                            >
                              <div className="text-center space-y-[var(--space-8)] border-b-2 border-[var(--color-ink)] pb-[var(--space-16)]">
                                <span className="font-mono-tech text-scale-12 uppercase tracking-widest">
                                  My Teaching Credo · Chapter {roman} of IV
                                </span>
                                <h3
                                  data-verify-id={`${secId}-lead`}
                                  className="font-display font-black text-scale-40 leading-tight text-center text-[var(--color-ink)]"
                                >
                                  {sec.lead}
                                </h3>
                              </div>

                              {!hasAudiences ? (
                                <div className="space-y-[var(--space-16)]">
                                  {sec.paragraphs.map((para, pIdx) => (
                                    <p
                                      key={pIdx}
                                      data-verify-id={`${secId}-p${pIdx + 1}`}
                                      className="text-scale-17 leading-relaxed"
                                    >
                                      <EmphasizedText
                                        text={para}
                                        episode={epId}
                                        staticMode={true}
                                      />
                                    </p>
                                  ))}
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 gap-[var(--space-16)]">
                                  {sec.paragraphs.length > 0 && (
                                    <div className="p-[var(--space-16)] border-2 border-[var(--color-ink)] space-y-[var(--space-8)]">
                                      <div className="border-b border-[var(--color-ink)] pb-[var(--space-4)]">
                                        <span className="block font-mono-tech text-scale-12 uppercase tracking-widest">
                                          Audience 01 · Classroom Core
                                        </span>
                                        <span className="block font-display font-bold text-scale-20">
                                          To My Learners and Students,
                                        </span>
                                      </div>
                                      <p
                                        data-verify-id={`${secId}-p1`}
                                        className="text-scale-17 leading-relaxed"
                                      >
                                        <EmphasizedText
                                          text={sec.paragraphs[0]}
                                          episode={epId}
                                          staticMode={true}
                                        />
                                      </p>
                                    </div>
                                  )}

                                  {(sec.audiences || []).map((aud, aIdx) => {
                                    const audId = `${secId}-aud${aIdx + 1}`;
                                    return (
                                      <div
                                        key={audId}
                                        className="p-[var(--space-16)] border-2 border-[var(--color-ink)] space-y-[var(--space-8)]"
                                      >
                                        <div className="border-b border-[var(--color-ink)] pb-[var(--space-4)]">
                                          <span className="block font-mono-tech text-scale-12 uppercase tracking-widest">
                                            {aIdx === 0
                                              ? 'Audience 02 · Professional Community'
                                              : 'Audience 03 · Shared Stewardship'}
                                          </span>
                                          <strong
                                            data-verify-id={`${audId}-label`}
                                            className="block font-display font-bold text-scale-20"
                                          >
                                            {aud.label}
                                          </strong>
                                        </div>
                                        <p
                                          data-verify-id={`${audId}-text`}
                                          className="text-scale-17 leading-relaxed"
                                        >
                                          <EmphasizedText
                                            text={aud.text}
                                            episode={epId}
                                            staticMode={true}
                                          />
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {sec.pullquote && (
                                <div className="pt-[var(--space-12)] border-t border-[var(--color-ink)]">
                                  <PullQuote
                                    quote={sec.pullquote}
                                    verifyId={`${secId}-pullquote`}
                                  />
                                </div>
                              )}
                            </section>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Delivered Episode 05: Reflection Questions */}
              {ep.reflectionQuestions && (
                <div className="space-y-[var(--space-12)] pt-[var(--space-16)] border-t border-[var(--color-ink)]">
                  <h3
                    data-verify-id={`${epId}-reflectionQuestions-title`}
                    className="font-display font-bold text-scale-24"
                  >
                    {ep.reflectionQuestions.title}
                  </h3>
                  {ep.reflectionQuestions.questions.map((q, qIdx) => {
                    const pathKey = `${epId}.reflectionQuestions.questions[${qIdx}]`;
                    if (hidePending && isStatusPending(q.status, pathKey)) return null;
                    const verifyId = `${epId}-ref-q${q.n ?? qIdx + 1}`;
                    const domId = `${epShort}-ref-q${q.n ?? qIdx + 1}`;
                    return (
                      <AnswerBlock
                        key={verifyId}
                        id={domId}
                        verifyId={verifyId}
                        questionNumber={q.n}
                        prompt={getQuestionPrompt(q)}
                        answer={q.answer}
                        pullQuoteExcerpt={getQuestionPullquote(q)}
                        forceExpanded={true}
                      />
                    );
                  })}
                </div>
              )}

              {/* Standard Questions */}
              {visibleQuestions.length > 0 && (
                <div className="space-y-[var(--space-16)]">
                  <h3 className="font-display font-bold text-scale-20">
                    Observation questions and coursework analysis
                  </h3>
                  {visibleQuestions.map((q, qIdx) => {
                    const qId = getQuestionId(ep.number, 'q', q, qIdx);
                    return (
                      <AnswerBlock
                        key={qId}
                        id={qId}
                        questionNumber={q.n}
                        prompt={getQuestionPrompt(q)}
                        answer={q.answer}
                        pullQuoteExcerpt={getQuestionPullquote(q)}
                        forceExpanded={true}
                      />
                    );
                  })}
                </div>
              )}

              {/* Standard MatrixTables */}
              {visibleTables.map((tbl) => (
                <MatrixTable key={tbl.id} table={tbl} />
              ))}

              {/* Standard Reflection */}
              {showReflection && ep.reflection && (
                <div className="p-[var(--space-16)] shape-index-card space-y-[var(--space-8)] break-inside-avoid">
                  <h3 className="font-display font-bold text-scale-20">
                    Episode {ep.number} reflection
                  </h3>
                  <p
                    data-verify-id={`${epId}-reflection-prompt`}
                    className="font-semibold text-scale-17"
                  >
                    {ep.reflection.prompt}
                  </p>
                  <div
                    data-verify-id={`${epId}-reflection-answer`}
                    data-verify-paragraphs={reflectionParagraphs.length}
                    className="text-scale-17 space-y-[var(--space-8)]"
                  >
                    {reflectionParagraphs.map((para, pIdx) => (
                      <React.Fragment key={pIdx}>
                        {pIdx > 0 && '\n\n'}
                        <p>{para}</p>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </section>
          );
        })}


        {/* ========================================================= */}
        {/* ACT IV: EVIDENCE & APPENDICES                             */}
        {/* ========================================================= */}
        <section id="print-appendices" className="space-y-[var(--space-24)]">
          <h2 className="font-display font-extrabold text-scale-40 text-[var(--color-ink)] border-b-2 border-[var(--color-ink)] pb-[var(--space-8)]">
            Act IV: Evidence and appendices
          </h2>

          <div className="p-[var(--space-24)] shape-index-card-plain space-y-[var(--space-8)] text-scale-17">
            <h3 className="font-display font-bold text-scale-28">
              {appendicesData.resourceTeacher.name} ({appendicesData.resourceTeacher.designation})
            </h3>
            <p>
              <strong>Subject area:</strong> {appendicesData.resourceTeacher.subjectArea}
            </p>
            <p>
              <strong>Cooperating school:</strong> {appendicesData.resourceTeacher.school}
            </p>
            <p>{appendicesData.resourceTeacher.biographicalNote}</p>
          </div>

          {/* Cooperating Teacher Class Program & Schedule */}
          <div className="p-[var(--space-24)] shape-index-card-plain space-y-[var(--space-16)] break-inside-avoid">
            <h3 className="font-display font-bold text-scale-20 border-b-2 border-[var(--color-ink)] pb-[var(--space-8)]">
              Cooperating Teacher Class Program & Teaching Schedule
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-scale-14">
                <thead>
                  <tr className="border-b-2 border-[var(--color-ink)] bg-[var(--color-chalk)]">
                    <th className="p-[var(--space-8)] font-bold">Time Slot</th>
                    <th className="p-[var(--space-8)] font-bold">Section / Group</th>
                    <th className="p-[var(--space-8)] font-bold">Subject Area</th>
                    <th className="p-[var(--space-8)] font-bold">Observed Focus</th>
                  </tr>
                </thead>
                <tbody>
                  {appendicesData.classProgram.map((slot, idx) => {
                    const isPending = isStatusPending(slot.status, `appendices.classProgram[${idx}]`);
                    if (isPending && shouldHidePending()) return null;
                    return (
                      <tr key={idx} className="border-b border-[var(--color-border-light)]">
                        <td className="p-[var(--space-8)] font-mono text-scale-12">{slot.time}</td>
                        <td className="p-[var(--space-8)] font-bold">{slot.gradeSection}</td>
                        <td className="p-[var(--space-8)]">{slot.subject}</td>
                        <td className="p-[var(--space-8)]">{slot.focus}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-[var(--space-12)] border border-[var(--color-border-light)] bg-white">
              <img
                src="/assets/aistudio/class_schedule_42cb8c25.svg"
                alt="Cooperating Teacher Class Program: Herson N. Alamo, PhD, English 8"
                className="w-full h-auto max-h-[160mm] object-contain mx-auto"
              />
            </div>
          </div>

          {(appendicesData.documentation?.groups || []).some((g) => g.photos.length > 0) && (
            <div className="p-[var(--space-24)] shape-index-card-plain space-y-[var(--space-16)]">
              <h3 className="font-display font-bold text-scale-20 border-b-2 border-[var(--color-ink)] pb-[var(--space-8)]">
                {appendicesData.documentation.title}
              </h3>
              {(appendicesData.documentation?.groups || [])
                .filter((group) => group.photos.length > 0)
                .map((group) => (
                  <div key={group.id} className="space-y-[var(--space-16)]">
                    <h4 className="font-display font-bold text-scale-17 text-[var(--color-ink)]">
                      {group.name}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--space-24)]">
                      {group.photos.map((photo) => (
                        <PhotoFrame
                          key={photo.id}
                          src={resolveAppendixPhotoSrc(photo.file)}
                          caption=""
                          alt={photo.alt}
                          shape="plain"
                          treatment="none"
                          assetSlotLabel={photo.file}
                        />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}

          <div className="p-[var(--space-24)] shape-index-card-plain space-y-[var(--space-12)] break-inside-avoid">
            <h3 className="font-display font-bold text-scale-20">
              Primary worksheet PDFs
            </h3>
            <ul className="space-y-[var(--space-8)] text-scale-14">
              {episodesData.map((ep) => {
                const epId = getEpisodeId(ep);
                const pending = isStatusPending(getEpisodeStatus(ep), epId);
                if (hidePending && pending) return null;
                const hasPdf = Boolean(ep.worksheetPdf && ep.worksheetPdf.trim().length > 0);
                return (
                  <li
                    key={epId}
                    className="flex justify-between border-b border-[var(--color-border-light)] pb-[var(--space-4)]"
                  >
                    <span>
                      Episode {ep.number}: {ep.title}
                    </span>
                    {hasPdf ? (
                      <a href={ep.worksheetPdf} className="btn-ghost">
                        {ep.worksheetPdf}
                      </a>
                    ) : (
                      <span className="text-[var(--color-chalk-muted)] italic">
                        Worksheet PDF coming soon
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {(appendicesData.dtr.pages || []).map((page) => {
            const pageSrc = resolveAppendixPhotoSrc(page.file);
            if (!pageSrc) return null;
            return (
              <div
                key={page.id}
                className="p-[var(--space-24)] shape-index-card-plain space-y-[var(--space-12)] break-before-page break-after-page break-inside-avoid text-scale-14"
              >
                <h3 className="font-display font-bold text-scale-20">
                  {appendicesData.dtr.title || 'Daily Time Record'}
                </h3>
                <h4 className="font-display font-bold text-scale-17 text-[var(--color-ink)]">
                  {page.label}
                </h4>
                <div className="p-[var(--space-12)] shape-index-card-plain">
                  <a
                    href={pageSrc}
                    target="_blank"
                    rel="noopener"
                    className="block"
                  >
                    <img
                      src={pageSrc}
                      alt={page.alt}
                      className="max-h-[210mm] w-auto max-w-full mx-auto object-contain block"
                    />
                  </a>
                </div>
                <div>
                  <a
                    href={pageSrc}
                    target="_blank"
                    rel="noopener"
                    className="inline-block text-scale-14 font-semibold text-[var(--color-ink)] underline underline-offset-4"
                  >
                    Open full size
                  </a>
                </div>
              </div>
            );
          })}

          <div className="p-[var(--space-24)] shape-index-card-plain space-y-[var(--space-12)] break-inside-avoid text-scale-14">
            <h3 className="font-display font-bold text-scale-20">
              {appendicesData.clearance.title || 'Clearance'}
            </h3>
            {resolveAppendixPhotoSrc(appendicesData.clearance.file) && (
              <div className="space-y-[var(--space-12)]">
                <div className="p-[var(--space-12)] shape-index-card-plain">
                  <a
                    href={resolveAppendixPhotoSrc(appendicesData.clearance.file)}
                    target="_blank"
                    rel="noopener"
                    className="block"
                  >
                    <img
                      src={resolveAppendixPhotoSrc(appendicesData.clearance.file)}
                      alt={appendicesData.clearance.alt || 'Clearance'}
                      className="max-h-[210mm] w-auto max-w-full mx-auto object-contain block"
                    />
                  </a>
                </div>
                <div>
                  <a
                    href={resolveAppendixPhotoSrc(appendicesData.clearance.file)}
                    target="_blank"
                    rel="noopener"
                    className="inline-block text-scale-14 font-semibold text-[var(--color-ink)] underline underline-offset-4"
                  >
                    Open full size
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
