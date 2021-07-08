package com.modana.manage.controller;

import net.sourceforge.plantuml.OptionFlags;
import net.sourceforge.plantuml.api.PlantumlUtils;
import net.sourceforge.plantuml.code.Transcoder;
import net.sourceforge.plantuml.code.TranscoderUtil;
import net.sourceforge.plantuml.png.MetadataTag;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import javax.net.ssl.HttpsURLConnection;
import javax.servlet.RequestDispatcher;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * @author Kyrie Lee
 * @date 2021/7/7 15:47
 */
@Controller
@RequestMapping("/system-modeling")
public class SystemModelingController {
    private static final String DEFAULT_ENCODED_TEXT = "SyfFKj2rKt3CoKnELR1Io4ZDoSa70000";

    /**
     * Last part of the URL
     */
    public static final Pattern URL_PATTERN = Pattern.compile("^.*[^a-zA-Z0-9\\-\\_]([a-zA-Z0-9\\-\\_]+)");

    private static final Pattern RECOVER_UML_PATTERN = Pattern.compile("/uml/(.*)");

    static {
        OptionFlags.ALLOW_INCLUDE = false;
        if ("true".equalsIgnoreCase(System.getenv("ALLOW_PLANTUML_INCLUDE"))) {
            OptionFlags.ALLOW_INCLUDE = true;
        }
    }

    static public InputStream getImage(URL url) throws IOException {
        HttpURLConnection con = getConnection(url);
        return con.getInputStream();
    }


    @RequestMapping("/UMLByPost")
    public void post(HttpServletRequest request, HttpServletResponse response) throws IOException {
        request.setCharacterEncoding("UTF-8");

        String text = request.getParameter("text");
        String encoded = DEFAULT_ENCODED_TEXT;

        try {
            text = getTextFromUrl(request, text);
            encoded = getTranscoder().encode(text);
        } catch (Exception e) {
            e.printStackTrace();
        }

        redirectNow(request, response, encoded);
    }

    @RequestMapping("/UMLByGet")
    public void get(HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
        request.setCharacterEncoding("UTF-8");
        String text = request.getParameter("text");

        String metadata = request.getParameter("metadata");
        if (metadata != null) {
            InputStream img = null;
            try {
                img = getImage(new URL(metadata));
                MetadataTag metadataTag = new MetadataTag(img, "plantuml");
                String data = metadataTag.getData();
                if (data != null) {
                    text = data;
                }
            } finally {
                if (img != null) {
                    img.close();
                }
            }
        }
        try {
            text = getTextFromUrl(request, text);
        } catch (Exception e) {
            e.printStackTrace();
        }

        // no Text form has been submitted
        if (text == null || text.trim().isEmpty()) {
            redirectNow(request, response, DEFAULT_ENCODED_TEXT);
            return;
        }

        final String encoded = getTranscoder().encode(text);
        request.setAttribute("decoded", text);
        request.setAttribute("encoded", encoded);

        // check if an image map is necessary
        if (text != null && PlantumlUtils.hasCMapData(text)) {
            request.setAttribute("mapneeded", Boolean.TRUE);
        }

        final RequestDispatcher dispatcher = request.getRequestDispatcher("/index.html");
        dispatcher.forward(request, response);
    }


    private String getTextFromUrl(HttpServletRequest request, String text) throws IOException {
        String url = request.getParameter("url");
        final Matcher recoverUml = RECOVER_UML_PATTERN.matcher(request.getRequestURI().substring(
                request.getContextPath().length()));
        // the URL form has been submitted
        if (recoverUml.matches()) {
            final String data = recoverUml.group(1);
            text = getTranscoder().decode(data);
        } else if (url != null && !url.trim().isEmpty()) {
            // Catch the last part of the URL if necessary
            final Matcher m1 = URL_PATTERN.matcher(url);
            if (m1.find()) {
                url = m1.group(1);
            }
            text = getTranscoder().decode(url);
        }
        return text;
    }

    private void redirectNow(HttpServletRequest request, HttpServletResponse response, String encoded)
            throws IOException {
        final String result = request.getContextPath() + "/uml/" + encoded;
        response.sendRedirect(result);
    }

    private Transcoder getTranscoder() {
        return TranscoderUtil.getDefaultTranscoder();
    }

    static private HttpURLConnection getConnection(URL url) throws IOException {
        if (url.getProtocol().startsWith("https")) {
            HttpsURLConnection con = (HttpsURLConnection) url.openConnection();
            con.setRequestMethod("GET");
            // 10 seconds
            con.setReadTimeout(10000);
            con.connect();
            return con;
        } else {
            HttpURLConnection con = (HttpURLConnection) url.openConnection();
            con.setRequestMethod("GET");
            // 10 seconds
            con.setReadTimeout(10000);
            con.connect();
            return con;
        }
    }
}
