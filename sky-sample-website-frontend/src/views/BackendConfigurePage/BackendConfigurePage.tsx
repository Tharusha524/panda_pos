import React from "react";
import { Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import leftLandingLeave from "../../assets/b_leaf_l.svg";
import rightLandingLeave from "../../assets/b_leaf_r.svg";
import ImageCarousel from "../../components/ImageCarousel";
import BackendConfigureForm from "./BackendConfigureForm";
import index1 from "../../assets/new1.png";
import index2 from "../../assets/new2.png";
import index3 from "../../assets/new3.png";
import { APP_INFO } from "../../config/appInfo";

function BackendConfigurePage() {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up(990));

  return (
    <Stack
      sx={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflowY: "hidden",
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
            Connect your backend
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
            {APP_INFO.applicationName} — one-time server setup
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
            Point the app to your Laravel POS backend. After you save, the login
            screen opens and all API requests use this server.
          </Typography>
        </Stack>
        <Stack sx={{ flex: isMdUp ? 2 : 1 }}>
          <BackendConfigureForm />
        </Stack>
      </Stack>
      <img
        src={leftLandingLeave}
        alt=""
        width={150}
        height={150}
        style={{ position: "absolute", left: 0, bottom: -5, zIndex: 10 }}
      />
      <img
        src={rightLandingLeave}
        alt=""
        width={150}
        height={150}
        style={{ position: "absolute", right: 0, bottom: -20, zIndex: 10 }}
      />
    </Stack>
  );
}

export default BackendConfigurePage;
