# Meteor Impact Simulator - Agent Roles & Responsibilities

## Overview
The Meteor Impact Simulator is a sophisticated web application that combines NASA asteroid data with advanced physics calculations to simulate meteor impacts. This document defines the different agent roles and their responsibilities for effective project development, maintenance, and operation.

## Core Development Agents

### 🚀 Physics Engine Agent
**Primary Responsibility:** Impact physics calculations and atmospheric modeling

**Key Files:**
- `src/lib/physics/impactCalculator.ts` - Core impact physics engine
- `src/types/asteroid.ts` - Physics parameter definitions

**Responsibilities:**
- Maintain and enhance impact physics models
- Implement atmospheric entry calculations
- Update crater formation algorithms
- Validate physics against real-world data
- Optimize calculation performance

**Required Skills:**
- Physics/Mathematics background
- Experience with orbital mechanics
- Understanding of atmospheric science
- Numerical computation expertise

### 🌌 NASA Data Integration Agent
**Primary Responsibility:** NASA API integration and data processing

**Key Files:**
- `src/lib/nasa-api.ts` - NASA API service layer
- `src/lib/nasa/data-converter.ts` - Data transformation utilities
- `src/app/api/nasa/route.ts` - API route handlers

**Responsibilities:**
- Maintain NASA API integrations
- Handle API rate limiting and error recovery
- Update data conversion algorithms
- Ensure data accuracy and validation
- Monitor API changes and updates

**Required Skills:**
- API integration experience
- Data transformation expertise
- Error handling and resilience
- Knowledge of NASA NEO data formats

### 🎨 Frontend Experience Agent
**Primary Responsibility:** User interface and user experience design

**Key Files:**
- `src/app/page.tsx` - Main application layout
- `src/components/ControlPanel.tsx` - Control interface
- `src/components/GoogleMap.tsx` - Map integration
- `src/components/ResultsPanel.tsx` - Results display

**Responsibilities:**
- Design intuitive user interfaces
- Implement responsive design patterns
- Optimize user interaction flows
- Maintain visual consistency
- Ensure accessibility compliance

**Required Skills:**
- React/Next.js expertise
- UI/UX design principles
- Google Maps API integration
- Responsive design techniques

### 🏗️ Architecture & Infrastructure Agent
**Primary Responsibility:** System architecture and technical infrastructure

**Key Files:**
- `src/lib/store/meteorStore.ts` - State management
- `next.config.ts` - Build configuration
- `package.json` - Dependencies management

**Responsibilities:**
- Design and maintain system architecture
- Manage state management solutions
- Optimize performance and scalability
- Ensure code quality and standards
- Handle deployment and DevOps

**Required Skills:**
- System architecture design
- Performance optimization
- DevOps and deployment
- Code quality assurance

## Specialized Support Agents

### 🔒 Security & Data Protection Agent
**Primary Responsibility:** Security, privacy, and data protection

**Responsibilities:**
- Review and implement security best practices
- Ensure API key protection
- Validate data sanitization
- Monitor for vulnerabilities
- Implement privacy protection measures

**Required Skills:**
- Web security expertise
- Data protection knowledge
- Vulnerability assessment
- Privacy regulation compliance

### 🧪 Testing & Quality Assurance Agent
**Primary Responsibility:** Testing strategy and quality assurance

**Responsibilities:**
- Develop comprehensive test suites
- Implement automated testing
- Performance testing and optimization
- User acceptance testing coordination
- Quality metrics and reporting

**Required Skills:**
- Testing framework expertise
- Quality assurance methodologies
- Performance testing tools
- Test automation

### 📚 Documentation & Knowledge Agent
**Primary Responsibility:** Documentation and knowledge management

**Key Files:**
- `README.md` - Project documentation
- `AGENTS.md` - This role definition document

**Responsibilities:**
- Maintain comprehensive documentation
- Create user guides and tutorials
- Document API interfaces
- Knowledge base management
- Onboarding materials

**Required Skills:**
- Technical writing
- Documentation tools
- Knowledge management
- User education

## Operational Support Agents

### 🚨 Incident Response Agent
**Primary Responsibility:** Handle production issues and incidents

**Responsibilities:**
- Monitor system health and performance
- Respond to user-reported issues
- Coordinate incident resolution
- Post-incident analysis and improvements
- Emergency communication

**Required Skills:**
- Incident management
- Troubleshooting expertise
- Communication skills
- Root cause analysis

### 📊 Analytics & Monitoring Agent
**Primary Responsibility:** Performance monitoring and analytics

**Responsibilities:**
- Implement monitoring solutions
- Analyze usage patterns
- Performance optimization
- User behavior analytics
- System health reporting

**Required Skills:**
- Monitoring tools expertise
- Data analysis
- Performance optimization
- Reporting and visualization

## Collaboration Guidelines

### Communication Protocols
- **Daily Standups:** Core development agents meet daily for 15 minutes
- **Weekly Reviews:** All agents participate in weekly progress reviews
- **Code Reviews:** Required for all changes, minimum 2 reviewers
- **Documentation Updates:** All agents responsible for maintaining relevant docs

### Decision Making Process
1. **Technical Decisions:** Core development agents propose and review
2. **Feature Requests:** Frontend agent evaluates user experience impact
3. **Architecture Changes:** Architecture agent leads design discussions
4. **Security Decisions:** Security agent has final authority

### Knowledge Sharing
- **Code Comments:** All complex logic must be documented
- **Architecture Decisions:** Recorded in project documentation
- **API Changes:** Communicated across all affected agents
- **Bug Fixes:** Root cause and solution documented

## Agent Onboarding

### New Agent Integration
1. **Week 1:** Review project documentation and architecture
2. **Week 2:** Shadow existing agents on relevant tasks
3. **Week 3:** Contribute to small tasks with supervision
4. **Week 4:** Independent contribution with code review

### Required Reading
- Project README and setup instructions
- API documentation for relevant services
- Architecture decision records
- Coding standards and best practices

## Success Metrics

### Individual Agent Metrics
- **Code Quality:** Test coverage, linting compliance
- **Documentation:** Completeness and accuracy
- **Response Time:** Issue resolution and communication
- **Collaboration:** Code review participation and feedback

### Project Success Metrics
- **Performance:** Application speed and reliability
- **User Experience:** Usability and accessibility scores
- **Data Accuracy:** Physics model validation against real events
- **System Health:** Uptime and error rates

## Emergency Procedures

### Critical Issues
1. **Immediate Response:** Notify all core agents
2. **Assessment:** Determine impact and urgency
3. **Communication:** Update stakeholders as appropriate
4. **Resolution:** Coordinate fix across relevant agents
5. **Post-Mortem:** Document lessons learned

### Data Issues
1. **Detection:** Monitor for data anomalies
2. **Verification:** Cross-check with multiple sources
3. **Correction:** Update data processing logic
4. **Prevention:** Implement validation improvements

---

*This AGENTS.md document should be reviewed and updated quarterly to reflect evolving project needs and team structure.*
