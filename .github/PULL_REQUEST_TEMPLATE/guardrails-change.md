---
name: Clinical Guardrails Change
about: Template for changes to clinical guardrails (schema.yaml)
title: '[GUARDRAILS] '
labels: clinical-safety, requires-dual-approval
assignees: ''

---

## 🏥 Clinical Guardrails Change Request

### Change Summary
<!-- Provide a brief summary of the guardrails change -->

### Clinical Justification
<!-- Explain the clinical reasoning for this change -->

**Evidence/Guidelines:**
- [ ] FDA guidance
- [ ] Clinical study
- [ ] Professional organization recommendation
- [ ] Internal clinical review

**Sources:**
<!-- List specific sources, studies, or guidelines -->
1. 
2. 

### Proposed Changes
<!-- List specific changes to schema.yaml -->

| Medication | Field | Current Value | Proposed Value | Unit |
|------------|-------|---------------|----------------|------|
|            |       |               |                |      |

### Impact Analysis

**Affected Patient Population:**
<!-- Describe which patients will be affected and how -->

**Estimated Prescriptions Impacted:**
<!-- Provide approximate numbers or percentages -->

**System Impact:**
- [ ] No API changes required
- [ ] Backward compatible
- [ ] Database migration needed
- [ ] UI updates required

### Risk Assessment

**Risk Level:** ⬜ LOW ⬜ MEDIUM ⬜ HIGH

**Potential Risks:**
<!-- List any potential patient safety risks -->
1. 
2. 

**Mitigation Strategies:**
<!-- How will risks be addressed? -->
1. 
2. 

### Testing Plan

**Test Scenarios:**
- [ ] Unit tests for new constraints
- [ ] Integration tests with existing medications
- [ ] Edge case validation
- [ ] Performance impact assessed

**Clinical Validation:**
- [ ] Test cases reviewed by clinical team
- [ ] Sample prescriptions validated
- [ ] Error messages reviewed for clarity

### Rollback Strategy

**Rollback Plan:**
<!-- How to revert if issues arise -->
```bash
git revert <this-commit-hash>
npm run deploy:guardrails
```

**Monitoring Plan:**
<!-- What to monitor after deployment -->
- Constraint violation rate
- Error logs for specific medication
- Clinical team feedback channel

### Required Approvals

#### Clinical Review
- **Reviewer Name:** 
- **Credentials:** MD/PharmD License #
- **Review Date:** 
- **Approval:** ⬜ APPROVED ⬜ CHANGES REQUESTED

#### Technical Review
- **Reviewer Name:** 
- **Role:** 
- **Review Date:** 
- **Approval:** ⬜ APPROVED ⬜ CHANGES REQUESTED

### Checklist

#### Pre-Submission
- [ ] Version number incremented in schema.yaml
- [ ] Approval metadata added to schema.yaml
- [ ] All tests passing
- [ ] YAML validation successful
- [ ] Change request ticket created: #

#### Reviews Required
- [ ] Clinical reviewer assigned
- [ ] Technical reviewer assigned
- [ ] Security review (if adding new constraint types)
- [ ] Product owner notified

#### Documentation
- [ ] Clinical justification documented
- [ ] Impact analysis complete
- [ ] Rollback plan tested
- [ ] Monitoring alerts configured

### Related Issues
<!-- Link to change request ticket and any related issues -->
- Change Request: #
- Related Issues: #

### Deployment Notes
<!-- Any special considerations for deployment -->

---

**Note:** This PR requires dual approval (clinical + technical) before merging. Please ensure both reviewers have explicitly approved in the PR comments.