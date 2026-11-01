// Native React page. Data contract: backoffice/field_home.
import { Fragment, cssStyle, text, Field } from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      <div className={"page-head"}>
        <div>
          <h1>
            {data.choice1 === 0 ? (
              <>{"Field jobs"}</>
            ) : data.choice1 === 1 ? (
              <>{"My day"}</>
            ) : null}
          </h1>
          <div className={"sub"}>
            {data.v2}
            {" job"}
            {data.v3}
            {
              " on the list. Tap the phone number to call, the address to navigate."
            }
          </div>
        </div>
        {"\n  "}
        {data.choice4 === 0 ? (
          <>
            <a className={"btn btn-line"} href={"/app/field/schedule/"}>
              {"Schedule board"}
            </a>
          </>
        ) : null}
      </div>
      {"\n"}
      {data.rows5?.length ? (
        data.rows5.map((row5, index) => (
          <Fragment key={index}>
            {"\n"}
            <h3
              className={"mb-s mt"}
              style={cssStyle(
                "color:var(--ink-2);text-transform:uppercase;letter-spacing:.06em;font-size:.78rem",
              )}
            >
              {row5.v6}
            </h3>
            {"\n"}
            <div className={"grid g2"}>
              {"\n  "}
              {row5.rows7?.length ? (
                row5.rows7.map((row7, index) => (
                  <Fragment key={index}>
                    {"\n  "}
                    <div className={"card"}>
                      <div className={"card-b"}>
                        {"\n    "}
                        <div className={"spread"}>
                          <div className={"row"}>
                            <span
                              className={
                                "badge " +
                                (row7.choice8 === 0
                                  ? "b-blue"
                                  : row7.choice8 === 1
                                    ? "b-violet"
                                    : row7.choice8 === 2
                                      ? "b-amber"
                                      : row7.choice8 === 3
                                        ? "b-green"
                                        : "")
                              }
                            >
                              {row7.v9}
                            </span>
                            {row7.choice10 === 0 ? (
                              <>
                                <span className={"badge b-grey"}>
                                  {row7.v11}
                                </span>
                              </>
                            ) : null}
                          </div>
                          <span className={"small muted"}>{row7.v12}</span>
                        </div>
                        {"\n    "}
                        <div
                          className={"bold mt-s"}
                          style={cssStyle("font-size:1.05rem")}
                        >
                          {row7.v13}
                        </div>
                        {"\n    "}
                        <div className={"small muted"}>{row7.v14}</div>
                        {"\n    "}
                        <div className={"small mt-s"}>
                          <a
                            href={text(row7.v15)}
                            target={"_blank"}
                            rel={"noopener"}
                          >
                            {"📍 "}
                            {row7.v16}
                          </a>
                        </div>
                        {"\n    "}
                        <div className={"small"}>
                          <a href={"tel:" + text(row7.v17)}>
                            {"📞 "}
                            {row7.v18}
                          </a>
                        </div>
                        {"\n    "}
                        {row7.choice19 === 0 ? (
                          <>
                            <div className={"mt-s"}>
                              {row7.choice20 === 0 ? (
                                <>
                                  <span className={"badge b-green"}>
                                    {"Customer confirmed"}
                                  </span>
                                </>
                              ) : row7.choice20 === 1 ? (
                                <>
                                  <span className={"badge b-grey"}>
                                    {"Not yet confirmed"}
                                  </span>
                                </>
                              ) : null}
                              {row7.choice21 === 0 ? (
                                <>
                                  <div
                                    className={"small mt-s"}
                                    style={cssStyle("color:var(--amber)")}
                                  >
                                    {"Asked to reschedule: "}
                                    {row7.v22}
                                  </div>
                                </>
                              ) : null}
                            </div>
                          </>
                        ) : null}
                        {"\n    "}
                        <div className={"mt"}>
                          {row7.choice23 === 0 ? (
                            <>
                              <a
                                className={"btn btn-primary btn-block"}
                                href={text(row7.v24)}
                              >
                                {row7.v25}
                              </a>
                            </>
                          ) : row7.choice23 === 1 ? (
                            <>
                              <button
                                className={"btn btn-block is-disabled"}
                                title={text(row7.v26)}
                              >
                                {row7.v27}
                              </button>
                            </>
                          ) : null}
                        </div>
                        {"\n  "}
                      </div>
                    </div>
                    {"\n  "}
                  </Fragment>
                ))
              ) : (
                <></>
              )}
              {"\n"}
            </div>
            {"\n"}
          </Fragment>
        ))
      ) : (
        <>
          <div className={"card"}>
            <div className={"empty"}>
              {"Nothing scheduled for you. Enjoy the quiet."}
            </div>
          </div>
        </>
      )}
      {"\n"}
    </>
  );
}
