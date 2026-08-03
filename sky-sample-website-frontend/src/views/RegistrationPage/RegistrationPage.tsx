import { Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import leftLandingLeave from "../../assets/b_leaf_l.svg";
import rightLandingLeave from "../../assets/b_leaf_r.svg";
import ImageCarousel from "../../components/ImageCarousel";
import RegistrationForm from "./RegistrationForm";
import useCurrentUser from "../../hooks/useCurrentUser";
import PageLoader from "../../components/PageLoader";
import { Navigate } from "react-router";
import index1 from "../../assets/new1.png";
import index2 from "../../assets/new2.png";
import index3 from "../../assets/new3.png";

function RegistrationPage() {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up(990));
  const { user, status } = useCurrentUser();

  if (status === "loading" || status === "idle" || status === "pending") {
    return <PageLoader />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Stack
      sx={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflowY: "hidden ",
      }}
    >
      <Stack
        direction={isMdUp ? "row" : "column"}
        sx={{ width: "100%", overflowY: "auto" }}
      >
        <Stack
          sx={{
            flex: isMdUp ? 3 : 1,
            backgroundColor: "var(--surface-bg-alt)",
            height: isMdUp ? "100vh" : "auto",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ImageCarousel
            images={[
              { src: index1, alt: "Welcome" },
              { src: index2, alt: "Health & Safety" },
              { src: index3, alt: "Employee Engagement" },
            ]}
          />
          <Typography
            variant={isMdUp ? "h2" : "h3"}
            sx={{
              fontWeight: "700",
              color: "var(--surface-text-muted)",
              marginTop: "1rem",
              marginLeft: "1rem",
              marginRight: "1rem",
              textAlign: "center",
            }}
          >
            Sky Smart Technology
          </Typography>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: "600",
              color: "var(--surface-text-muted)",
              margin: "1rem",
              textAlign: "center",
            }}
          >
            copyright © 2025 Sky Smart Technology, All Rights Reserved
          </Typography>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: "400",
              color: "var(--surface-text-muted)",
              textAlign: "center",
              marginLeft: "3rem",
              marginRight: "3rem",
              marginBottom: "2rem",
            }}
          >
            Our dedicated teams of engineers, architects, and tech consultants
            are here to support your bold ideas, guide you through our
            cutting-edge solutions, and provide answers to your technical and
            business questions. Let's build smarter, together.
          </Typography>
        </Stack>
        <Stack sx={{ flex: isMdUp ? 2 : 1, justifyContent: "center" }}>
          <RegistrationForm />
        </Stack>
      </Stack>
      <img
        src={leftLandingLeave}
        alt="Logo"
        width={150}
        height={150}
        style={{ position: "absolute", left: 0, bottom: -5, zIndex: 10 }}
      />
      <img
        src={rightLandingLeave}
        alt="Logo"
        width={150}
        height={150}
        style={{ position: "absolute", right: 0, bottom: -20, zIndex: 10 }}
      />
    </Stack>
  );
}

export default RegistrationPage;
