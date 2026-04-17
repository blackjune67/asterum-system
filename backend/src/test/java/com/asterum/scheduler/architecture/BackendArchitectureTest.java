package com.asterum.scheduler.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

@AnalyzeClasses(packages = "com.asterum.scheduler", importOptions = ImportOption.DoNotIncludeTests.class)
class BackendArchitectureTest {

    @ArchTest
    static final ArchRule layered_dependency_flow = layeredArchitecture()
        .consideringOnlyDependenciesInLayers()
        .layer("Presentation").definedBy("com.asterum.scheduler..presentation..")
        .layer("Application").definedBy("com.asterum.scheduler..application..")
        .layer("Domain").definedBy("com.asterum.scheduler..domain..")
        .layer("Infrastructure").definedBy("com.asterum.scheduler..infrastructure..")
        .whereLayer("Presentation").mayOnlyAccessLayers("Application", "Domain")
        .whereLayer("Application").mayOnlyAccessLayers("Domain", "Infrastructure")
        .whereLayer("Infrastructure").mayOnlyAccessLayers("Domain", "Application")
        .whereLayer("Domain").mayNotAccessAnyLayer();

    @ArchTest
    static final ArchRule presentation_must_not_depend_on_infrastructure = noClasses()
        .that().resideInAnyPackage("com.asterum.scheduler..presentation..")
        .should().dependOnClassesThat().resideInAnyPackage("com.asterum.scheduler..infrastructure..");

    @ArchTest
    static final ArchRule application_must_not_depend_on_presentation = noClasses()
        .that().resideInAnyPackage("com.asterum.scheduler..application..")
        .should().dependOnClassesThat().resideInAnyPackage("com.asterum.scheduler..presentation..");

    @ArchTest
    static final ArchRule domain_must_not_depend_on_transport_types = noClasses()
        .that().resideInAnyPackage("com.asterum.scheduler..domain..")
        .should().dependOnClassesThat().resideInAnyPackage(
            "com.asterum.scheduler..presentation.."
        );
}
