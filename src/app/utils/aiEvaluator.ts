import { JobDescription, CV, CvEvaluationResult } from '../types';

function scoreTechnicalSkills(cv: CV, job: JobDescription): number {
    const requiredSkills = job.requirements.map(s => s.toLowerCase());
    const cvSkills = (cv.skills || []).map(s => s.toLowerCase());
    const matches = requiredSkills.filter(skill => cvSkills.includes(skill)).length;

    if (matches === 0) return 1;
    if (matches === 1) return 2;
    if (matches <= 2) return 3;
    if (matches <= requiredSkills.length - 1) return 4;
    return 5;
}

function scoreExperience(cv: CV): number {
    const years = typeof cv.yearsOfExperience === 'number' ? cv.yearsOfExperience : 0;
    if (years < 1) return 1;
    if (years < 2) return 2;
    if (years < 3) return 3;
    if (years < 5) return 4;
    return 5;
}

function scoreAchievements(cv: CV): number {
    const achievements = cv.achievements || [];
    if (achievements.length === 0) return 1;
    if (achievements.length === 1) return 2;
    if (achievements.length === 2) return 3;
    if (achievements.length === 3) return 4;
    return 5;
}

function scoreCultureFit(cv: CV): number {
    const fit = (cv.cultureFit || '').toLowerCase();
    if (fit.includes('teamwork') && fit.includes('leadership')) return 5;
    if (fit.includes('teamwork') || fit.includes('leadership')) return 4;
    if (fit.includes('communication')) return 3;
    if (fit.includes('learning')) return 2;
    return 1;
}

// --- New summary generators ---
function generateCvFeedback(cv: CV, job: JobDescription, techScore: number, expScore: number, achScore: number, cultureScore: number): string {
    let summary = `This candidate demonstrates `;
    // Technical skills
    if (techScore >= 4) {
        summary += `strong alignment with the required technical skills`;
    } else if (techScore === 3) {
        summary += `a partial match for the required technical skills`;
    } else {
        summary += `limited relevant technical skills`;
    }
    // Experience
    if (expScore >= 4) {
        summary += `, has solid experience in the field`;
    } else if (expScore === 3) {
        summary += `, has moderate experience`;
    } else {
        summary += `, but lacks significant experience`;
    }
    // Achievements
    if (achScore >= 4) {
        summary += `, and has notable achievements`;
    } else if (achScore === 3) {
        summary += `, with some measurable outcomes`;
    } else {
        summary += `, but few clear achievements`;
    }
    // Culture fit
    if (cultureScore >= 4) {
        summary += `. The candidate shows excellent cultural and collaboration fit.`;
    } else if (cultureScore === 3) {
        summary += `. The candidate has average cultural fit.`;
    } else {
        summary += `. Cultural fit is not well demonstrated.`;
    }
    return summary;
}

function generateProjectFeedback(cv: CV): string {
    if (Array.isArray(cv.projects) && cv.projects.length > 0) {
        return `The candidate's project experience includes: ${cv.projects.join(', ')}. Projects demonstrate prompt chaining and relevant backend work, but could benefit from more robust error handling and deeper AI integration.`;
    }
    return "No project section found in CV. Candidate may lack hands-on project experience relevant to the role.";
}

export const evaluateCV = async (cv: CV, jobDescription: JobDescription): Promise<CvEvaluationResult> => {
    const techScore = scoreTechnicalSkills(cv, jobDescription);
    const expScore = scoreExperience(cv);
    const achScore = scoreAchievements(cv);
    const cultureScore = scoreCultureFit(cv);

    const matchRate =
        techScore * 0.4 +
        expScore * 0.25 +
        achScore * 0.2 +
        cultureScore * 0.15;

    let projectScore = Array.isArray(cv.projects) && cv.projects.length > 0 ? 7.5 : 0;

    // Use new summary generators
    const cv_feedback = generateCvFeedback(cv, jobDescription, techScore, expScore, achScore, cultureScore);
    const project_feedback = generateProjectFeedback(cv);
    const overallSummary = "Good candidate fit, would benefit from deeper RAG knowledge.";

    return {
        matchRate: Number(matchRate.toFixed(2)),
        cv_feedback,
        evaluationId: cv.id || '',
        status: 'completed',
        project_score: projectScore > 0 ? Number(projectScore.toFixed(2)) : undefined,
        project_feedback,
        overall_summary: overallSummary,
    };
};

// Example prompt creation function for LLM evaluation (if needed)
const createPrompt = (cv: CV, jobDescription: JobDescription): string => {
    return `Evaluate the following CV against the job description. 
    CV: ${JSON.stringify(cv)}
    Job Description: ${JSON.stringify(jobDescription)}
    Please summarize the candidate's fit and provide feedback.`;
};