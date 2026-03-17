/**
 * AI Ethics & Safety Framework
 * Comprehensive ethical governance for autonomous AI
 * 
 * Components:
 * - Ethical Decision Matrix
 * - Bias Detection & Mitigation
 * - Transparency Engine
 * - Privacy Protection
 * - Accountability Logging
 * - Value Alignment
 */

class AIEthicsFramework {
    constructor() {
        this.ethicalPrinciples = {
            beneficence: { weight: 1.0, active: true },      // Promote well-being
            nonMaleficence: { weight: 1.5, active: true },   // Prevent harm
            autonomy: { weight: 1.2, active: true },          // Respect choice
            justice: { weight: 1.3, active: true },           // Fair treatment
            transparency: { weight: 1.0, active: true },      // Explainable AI
            privacy: { weight: 1.5, active: true },           // Data protection
            accountability: { weight: 1.2, active: true }     // Take responsibility
        };
        
        this.decisionLog = [];
        this.biasMetrics = new Map();
        this.privacyAudit = new PrivacyAuditor();
        this.transparencyEngine = new TransparencyEngine();
        this.accountabilityLogger = new AccountabilityLogger();
        
        this.init();
    }

    async init() {
        console.log('[AIEthics] Initializing ethics framework...');
        
        await this.privacyAudit.init();
        await this.transparencyEngine.init();
        await this.accountabilityLogger.init();
        
        this.loadEthicalConstraints();
        console.log('[AIEthics] Framework initialized ✓');
    }

    /**
     * Ethical Decision Matrix
     * Evaluate decisions against multiple ethical principles
     */
    async evaluateDecision(decision) {
        const evaluation = {
            decision: decision,
            timestamp: Date.now(),
            scores: {},
            totalScore: 0,
            approved: false,
            reasoning: []
        };
        
        // Evaluate against each principle
        for (const [principle, config] of Object.entries(this.ethicalPrinciples)) {
            if (!config.active) continue;
            
            const score = await this.evaluatePrinciple(principle, decision);
            evaluation.scores[principle] = score;
            evaluation.totalScore += score * config.weight;
            
            if (score < 0.5) {
                evaluation.reasoning.push({
                    principle,
                    concern: `Low score on ${principle}: ${score}`,
                    severity: 'warning'
                });
            }
        }
        
        // Calculate weighted average
        const maxScore = Object.values(this.ethicalPrinciples)
            .filter(p => p.active)
            .reduce((sum, p) => sum + p.weight, 0);
        
        evaluation.normalizedScore = evaluation.totalScore / maxScore;
        evaluation.approved = evaluation.normalizedScore >= 0.7;
        
        // Log decision
        this.decisionLog.push(evaluation);
        await this.accountabilityLogger.logDecision(evaluation);
        
        // Generate transparency report
        if (this.transparencyEngine) {
            const report = await this.transparencyEngine.generateReport(evaluation);
            evaluation.transparencyReport = report;
        }
        
        return evaluation;
    }

    /**
     * Evaluate specific ethical principle
     */
    async evaluatePrinciple(principle, decision) {
        switch (principle) {
            case 'beneficence':
                return this.evaluateBeneficence(decision);
            case 'nonMaleficence':
                return this.evaluateNonMaleficence(decision);
            case 'autonomy':
                return this.evaluateAutonomy(decision);
            case 'justice':
                return this.evaluateJustice(decision);
            case 'transparency':
                return this.evaluateTransparency(decision);
            case 'privacy':
                return this.evaluatePrivacy(decision);
            case 'accountability':
                return this.evaluateAccountability(decision);
            default:
                return 0.5;
        }
    }

    /**
     * Evaluate beneficence (doing good)
     */
    evaluateBeneficence(decision) {
        let score = 0.5;
        
        // Does it improve user experience?
        if (decision.improvesUX) score += 0.2;
        
        // Does it provide value?
        if (decision.providesValue) score += 0.2;
        
        // Does it enhance capabilities?
        if (decision.enhancesCapabilities) score += 0.1;
        
        return Math.min(1.0, score);
    }

    /**
     * Evaluate non-maleficence (avoiding harm)
     */
    evaluateNonMaleficence(decision) {
        let score = 1.0;
        
        // Risk assessment
        if (decision.risk > 0.5) score -= 0.3;
        if (decision.risk > 0.8) score -= 0.3;
        
        // Potential for negative consequences
        if (decision.hasNegativeConsequences) score -= 0.2;
        
        // Irreversibility
        if (decision.isIrreversible) score -= 0.2;
        
        return Math.max(0.0, score);
    }

    /**
     * Evaluate autonomy (respecting user choice)
     */
    evaluateAutonomy(decision) {
        let score = 1.0;
        
        // Does it preserve user control?
        if (decision.removesUserControl) score -= 0.4;
        
        // Is user informed?
        if (!decision.userInformed) score -= 0.2;
        
        // Can user override?
        if (!decision.userCanOverride) score -= 0.2;
        
        // Does it manipulate?
        if (decision.isManipulative) score -= 0.3;
        
        return Math.max(0.0, score);
    }

    /**
     * Evaluate justice (fair treatment)
     */
    evaluateJustice(decision) {
        let score = 0.5;
        
        // Check for bias
        const biasScore = this.detectBias(decision);
        score += (1 - biasScore) * 0.3;
        
        // Fair across user groups?
        if (decision.isFairAcrossGroups) score += 0.2;
        
        // No discrimination
        if (!decision.isDiscriminatory) score += 0.2;
        
        return Math.min(1.0, score);
    }

    /**
     * Evaluate transparency (explainability)
     */
    async evaluateTransparency(decision) {
        let score = 0.5;
        
        // Is decision explainable?
        if (decision.isExplainable) score += 0.2;
        
        // Is reasoning accessible?
        if (decision.reasoningAccessible) score += 0.2;
        
        // Are limitations disclosed?
        if (decision.limitationsDisclosed) score += 0.1;
        
        return Math.min(1.0, score);
    }

    /**
     * Evaluate privacy (data protection)
     */
    async evaluatePrivacy(decision) {
        const privacyScore = await this.privacyAudit.auditDecision(decision);
        return privacyScore;
    }

    /**
     * Evaluate accountability (responsibility)
     */
    async evaluateAccountability(decision) {
        let score = 0.5;
        
        // Is there audit trail?
        if (decision.hasAuditTrail) score += 0.2;
        
        // Can we trace responsibility?
        if (decision.responsibilityClear) score += 0.2;
        
        // Is there recourse?
        if (decision.hasRecourse) score += 0.1;
        
        return Math.min(1.0, score);
    }

    /**
     * Detect bias in decision
     */
    detectBias(decision) {
        const biases = [];
        
        // Check for demographic bias
        if (decision.affectsDemographics) {
            const demographicBias = this.checkDemographicBias(decision);
            if (demographicBias > 0.3) {
                biases.push({ type: 'demographic', severity: demographicBias });
            }
        }
        
        // Check for historical bias
        if (decision.usesHistoricalData) {
            const historicalBias = this.checkHistoricalBias(decision);
            if (historicalBias > 0.3) {
                biases.push({ type: 'historical', severity: historicalBias });
            }
        }
        
        // Check for representation bias
        const representationBias = this.checkRepresentationBias(decision);
        if (representationBias > 0.3) {
            biases.push({ type: 'representation', severity: representationBias });
        }
        
        // Store bias metrics
        this.biasMetrics.set(decision.id || Date.now(), {
            biases,
            timestamp: Date.now(),
            overallBias: biases.reduce((sum, b) => sum + b.severity, 0) / biases.length || 0
        });
        
        return biases.reduce((sum, b) => sum + b.severity, 0) / (biases.length || 1);
    }

    /**
     * Check demographic bias
     */
    checkDemographicBias(decision) {
        // Implement demographic parity checks
        return 0.0; // Placeholder
    }

    /**
     * Check historical bias
     */
    checkHistoricalBias(decision) {
        // Analyze training data for historical biases
        return 0.0; // Placeholder
    }

    /**
     * Check representation bias
     */
    checkRepresentationBias(decision) {
        // Check if all groups are adequately represented
        return 0.0; // Placeholder
    }

    /**
     * Load ethical constraints
     */
    loadEthicalConstraints() {
        // Red lines - never cross
        this.redLines = [
            'Never harm user physically or psychologically',
            'Never deceive or manipulate user',
            'Never violate user privacy without explicit consent',
            'Never discriminate based on protected characteristics',
            'Never make irreversible changes without user confirmation',
            'Never hide AI decision-making from user',
            'Never prioritize efficiency over safety'
        ];
        
        console.log('[AIEthics] Loaded', this.redLines.length, 'ethical red lines');
    }

    /**
     * Check if decision violates red lines
     */
    checkRedLines(decision) {
        const violations = [];
        
        // Check each red line
        if (decision.causesHarm) {
            violations.push('Causes harm to user');
        }
        
        if (decision.isDeceptive) {
            violations.push('Deceptive behavior');
        }
        
        if (decision.violatesPrivacy) {
            violations.push('Privacy violation');
        }
        
        if (decision.isDiscriminatory) {
            violations.push('Discriminatory behavior');
        }
        
        return {
            violated: violations.length > 0,
            violations
        };
    }

    /**
     * Get ethics statistics
     */
    getStats() {
        return {
            decisionsEvaluated: this.decisionLog.length,
            approvalRate: this.decisionLog.filter(d => d.approved).length / (this.decisionLog.length || 1),
            avgScore: this.decisionLog.reduce((acc, d) => acc + d.normalizedScore, 0) / (this.decisionLog.length || 1),
            biasMetrics: Object.fromEntries(this.biasMetrics),
            redLineViolations: this.decisionLog.filter(d => d.redLineViolated).length
        };
    }

    /**
     * Export ethics report
     */
    exportEthicsReport() {
        return {
            timestamp: Date.now(),
            principles: this.ethicalPrinciples,
            statistics: this.getStats(),
            recentDecisions: this.decisionLog.slice(-100),
            biasAnalysis: Object.fromEntries(this.biasMetrics),
            redLines: this.redLines
        };
    }
}

/**
 * Privacy Auditor
 * Ensures data privacy compliance
 */
class PrivacyAuditor {
    constructor() {
        this.privacyPrinciples = [
            'data_minimization',
            'purpose_limitation',
            'consent',
            'transparency',
            'security',
            'user_rights'
        ];
        
        this.dataFlows = new Map();
        this.consentRecords = new Map();
    }

    async init() {
        console.log('[PrivacyAuditor] Initialized');
    }

    /**
     * Audit decision for privacy compliance
     */
    async auditDecision(decision) {
        let score = 1.0;
        
        // Check data minimization
        if (decision.collectsMoreDataThanNeeded) {
            score -= 0.2;
        }
        
        // Check consent
        if (decision.requiresConsent && !decision.hasConsent) {
            score -= 0.3;
        }
        
        // Check data security
        if (decision.handlesSensitiveData && !decision.isSecure) {
            score -= 0.3;
        }
        
        // Check purpose limitation
        if (decision.usesDataBeyondPurpose) {
            score -= 0.2;
        }
        
        return Math.max(0.0, score);
    }

    /**
     * Record user consent
     */
    recordConsent(userId, consentType, granted) {
        this.consentRecords.set(`${userId}:${consentType}`, {
            granted,
            timestamp: Date.now(),
            version: '1.0'
        });
    }

    /**
     * Check if consent exists
     */
    hasConsent(userId, consentType) {
        const record = this.consentRecords.get(`${userId}:${consentType}`);
        return record && record.granted;
    }
}

/**
 * Transparency Engine
 * Makes AI decisions explainable
 */
class TransparencyEngine {
    constructor() {
        this.explanationTemplates = new Map();
        this.isInitialized = false;
    }

    async init() {
        this.initializeTemplates();
        this.isInitialized = true;
    }

    /**
     * Generate transparency report
     */
    async generateReport(evaluation) {
        return {
            decision: evaluation.decision,
            score: evaluation.normalizedScore,
            approved: evaluation.approved,
            principleScores: evaluation.scores,
            reasoning: evaluation.reasoning,
            explanation: this.generateExplanation(evaluation),
            confidence: this.calculateConfidence(evaluation),
            alternatives: await this.suggestAlternatives(evaluation)
        };
    }

    /**
     * Generate human-readable explanation
     */
    generateExplanation(evaluation) {
        const explanations = [];
        
        if (evaluation.approved) {
            explanations.push('This decision aligns with our ethical principles.');
        } else {
            explanations.push('This decision raised ethical concerns.');
        }
        
        // Add principle-specific explanations
        for (const [principle, score] of Object.entries(evaluation.scores)) {
            if (score < 0.5) {
                explanations.push(`Concern: Low score on ${principle} (${(score * 100).toFixed(0)}%)`);
            } else if (score > 0.8) {
                explanations.push(`Strong: High alignment with ${principle} (${(score * 100).toFixed(0)}%)`);
            }
        }
        
        return explanations.join(' ');
    }

    /**
     * Calculate confidence in decision
     */
    calculateConfidence(evaluation) {
        const variance = this.calculateVariance(Object.values(evaluation.scores));
        return Math.max(0.5, 1 - variance);
    }

    /**
     * Suggest alternative decisions
     */
    async suggestAlternatives(evaluation) {
        const alternatives = [];
        
        // Generate alternatives that score better on weak principles
        for (const [principle, score] of Object.entries(evaluation.scores)) {
            if (score < 0.5) {
                alternatives.push({
                    modification: `Improve ${principle} alignment`,
                    expectedImprovement: 0.5 - score
                });
            }
        }
        
        return alternatives;
    }

    /**
     * Initialize explanation templates
     */
    initializeTemplates() {
        this.explanationTemplates.set('detection', {
            what: 'I detected {object} with {confidence}% confidence',
            how: 'Using computer vision model trained on COCO dataset',
            why: 'To help you identify and count objects',
            limitations: 'May struggle in low light or with occluded objects'
        });
    }

    /**
     * Calculate variance
     */
    calculateVariance(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    }
}

/**
 * Accountability Logger
 * Maintains audit trail of all decisions
 */
class AccountabilityLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 10000;
    }

    async init() {
        await this.loadLogs();
        console.log('[AccountabilityLogger] Initialized');
    }

    /**
     * Log decision
     */
    async logDecision(decision) {
        const logEntry = {
            id: this.generateId(),
            timestamp: Date.now(),
            decision: decision.decision,
            evaluation: {
                score: decision.normalizedScore,
                approved: decision.approved,
                principleScores: decision.scores
            },
            reasoning: decision.reasoning,
            accountability: {
                reviewer: 'AI Ethics Framework',
                version: '1.0',
                auditable: true
            }
        };
        
        this.logs.push(logEntry);
        
        // Limit logs
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        // Persist
        await this.saveLogs();
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Save logs to storage
     */
    async saveLogs() {
        try {
            localStorage.setItem('osai_ethics_logs', JSON.stringify(this.logs.slice(-1000)));
        } catch (e) {
            console.error('[AccountabilityLogger] Save error:', e);
        }
    }

    /**
     * Load logs from storage
     */
    async loadLogs() {
        try {
            const stored = localStorage.getItem('osai_ethics_logs');
            if (stored) {
                this.logs = JSON.parse(stored);
            }
        } catch (e) {
            console.error('[AccountabilityLogger] Load error:', e);
        }
    }

    /**
     * Export audit trail
     */
    exportAuditTrail() {
        return {
            timestamp: Date.now(),
            totalLogs: this.logs.length,
            logs: this.logs
        };
    }
}

// Initialize global ethics framework
window.aiEthics = new AIEthicsFramework();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIEthicsFramework;
}
