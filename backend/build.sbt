import play.sbt.routes.RoutesKeys
import org.scalafmt.sbt.ScalafmtPlugin.autoImport.*

name := """lasius"""

Global / onChangedBuildSource := ReloadOnSourceChanges

lazy val root = (project in file("."))
  .enablePlugins(PlayScala,
                 BuildInfoPlugin,
                 SwaggerPlugin,
                 AutomateHeaderPlugin)
  .settings(
    RoutesKeys.routesImport += "binders.Binders._",
    swaggerV3 := true
  )

swaggerDomainNameSpaces := Seq("models", "controllers")
swaggerPrettyJson       := true
swaggerOutputTransformers += "core.swagger.SwaggerRenameModelClassesTransformer"

scalaVersion := "2.13.16"

buildInfoKeys := Seq[BuildInfoKey](organization,
                                   name,
                                   version,
                                   BuildInfoKey.action("gitVersion") {
                                     dynverGitDescribeOutput
                                   })

buildInfoPackage := "version"

resolvers += "Tegonal releases".at(
  "https://github.com/tegonal/tegonal-mvn/raw/main/releases/")

resolvers += "Sonatype OSS Releases".at(
  "https://oss.sonatype.org/content/repositories/releases")

val pekkoVersion             = "1.1.3"
val reactiveMongoVersion     = "1.1.0"
val reactiveMongoPlayVersion = s"$reactiveMongoVersion-play30.RC14"
val playVersion              = "3.0.5"
// Play framework 3.x is still bound to older guice version
val guiceVersion      = "6.0.0"
val pureConfigVersion = "0.17.8"

libraryDependencies ++= Seq(
  "org.reactivemongo" %% "play2-reactivemongo" % reactiveMongoPlayVersion,
  "com.github.scullxbones"      %% "pekko-persistence-mongodb" % "1.2.2",
  "com.tegonal"                 %% "play-json-typedid"         % "2.0.0",
  "org.julienrf"                %% "play-json-derived-codecs"  % "11.0.0",
  "org.playframework"           %% "play-json-joda"            % "3.0.4",
  "com.google.inject"            % "guice"                     % guiceVersion,
  "com.google.inject.extensions" % "guice-assistedinject"      % guiceVersion,
  // support more than 22 fields in case classes
  "org.apache.pekko" %% "pekko-persistence"           % pekkoVersion,
  "org.apache.pekko" %% "pekko-actor"                 % pekkoVersion,
  "org.apache.pekko" %% "pekko-actor-typed"           % pekkoVersion,
  "org.apache.pekko" %% "pekko-serialization-jackson" % pekkoVersion,
  "org.apache.pekko" %% "pekko-persistence-query"     % pekkoVersion,
  "org.apache.pekko" %% "pekko-slf4j"                 % pekkoVersion,
  "org.apache.pekko" %% "pekko-testkit"               % pekkoVersion % "test",
  "org.apache.pekko" %% "pekko-persistence-testkit"   % pekkoVersion % "test",
  // reativemongo based connector for persistent akka
  "org.mindrot"         % "jbcrypt"                   % "0.4",
  "de.flapdoodle.embed" % "de.flapdoodle.embed.mongo" % "4.18.1" % "test",
  "io.github.alstanchev" % "pekko-persistence-inmemory_2.13" % "1.2.1" % "test",
  "io.kontainers"       %% "purecsv"                         % "1.3.10",
  "com.chuusai"         %% "shapeless"                       % "2.3.12",
  "net.openhft"          % "zero-allocation-hashing"         % "0.27ea0",
  "com.github.pureconfig" %% "pureconfig" % pureConfigVersion,
  // depend on this plugin to be able to provide custom OutputTransformer
  "io.github.play-swagger" %% "play-swagger" % "2.0.4",
  "com.github.fdimuccio"   %% "play2-sockjs" % "0.10.0",

  // basic jwt token and jwks support
  // "com.github.jwt-scala" %% "jwt-play" % "10.0.1",
  "com.auth0" % "java-jwt" % "4.5.0",
  "com.auth0" % "jwks-rsa" % "0.22.1",

  // oauth2 provider dependencies
  // oauth2 provider dependencies to be able to provide a simple oauth server packed with lasius
  "com.nulab-inc" %% "scala-oauth2-core"     % "1.6.0",
  "com.nulab-inc" %% "play2-oauth2-provider" % "2.0.0",
  ehcache,
  ws,
  specs2 % Test,
  guice,
  "org.webjars" % "swagger-ui" % "5.18.3"
)

dependencyOverrides ++= Seq(
  "com.fasterxml.jackson.module" % "jackson-module-scala_2.13" % "2.18.2",
  "com.fasterxml.jackson.core"   % "jackson-databind"          % "2.18.2",
  "com.fasterxml.jackson.core"   % "jackson-core"              % "2.18.2",
  "com.fasterxml.jackson.core"   % "jackson-annotations"       % "2.18.2",
)

Test / javaOptions += "-Dconfig.file=conf/test.conf"

Test / console / fork := true

Production / javaOptions.withRank(
  KeyRanks.Invisible) += "-Dconfig.file=conf/prod.conf -Dlogger.resource=logback-prod.xml"

scalafmtOnCompile := true

headerLicense := Some(
  HeaderLicense.Custom(
    """|
       |Lasius - Open source time tracker for teams
       |Copyright (c) Tegonal Genossenschaft (https://tegonal.com)
       |
       |This file is part of Lasius.
       |
       |Lasius is free software: you can redistribute it and/or modify it under the
       |terms of the GNU Affero General Public License as published by the Free
       |Software Foundation, either version 3 of the License, or (at your option)
       |any later version.
       |
       |Lasius is distributed in the hope that it will be useful, but WITHOUT ANY
       |WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
       |FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
       |details.
       |
       |You should have received a copy of the GNU Affero General Public License
       |along with Lasius. If not, see <https://www.gnu.org/licenses/>.
       |""".stripMargin
  ))
