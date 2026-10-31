// Native React page. Data contract: notifications.
import { Fragment, cssStyle, text, ActionForm, CsrfField } from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      <div className={"page-head"}>
        <div>
          <h1>{"Notifications"}</h1>
          <div className={"sub"}>{"Updates from the team and the system."}</div>
        </div>
        {"\n  "}
        <ActionForm method={"post"} action={"/notifications/read-all/"}>
          <CsrfField />
          <button className={"btn btn-line btn-sm"}>
            {"Mark all as read"}
          </button>
        </ActionForm>
      </div>
      {"\n"}
      <div className={"card"}>
        <div className={"card-b tight"}>
          {"\n  "}
          {data.rows1?.length ? (
            data.rows1.map((row1, index) => (
              <Fragment key={index}>
                {"\n  "}
                <a
                  href={"/notifications/" + text(row1.v2) + "/go/"}
                  className={"row"}
                  style={cssStyle(
                    "padding:.8rem 1.1rem;border-bottom:1px solid var(--line);color:inherit;gap:.8rem;align-items:flex-start",
                  )}
                >
                  {"\n    "}
                  <span
                    style={cssStyle(
                      "width:9px;height:9px;border-radius:50%;margin-top:7px;flex:none;background:" +
                        (row1.choice3 === 0
                          ? "transparent"
                          : row1.choice3 === 1
                            ? "var(--brand)"
                            : ""),
                    )}
                  ></span>
                  {"\n    "}
                  <span className={"grow"}>
                    <span className={row1.choice4 === 0 ? "bold" : ""}>
                      {row1.v5}
                    </span>
                    {row1.choice6 === 0 ? (
                      <>
                        <br />
                        <span className={"small muted"}>{row1.v7}</span>
                      </>
                    ) : null}
                  </span>
                  {"\n    "}
                  <span className={"small faint nowrap"}>{row1.v8}</span>
                  {"\n  "}
                </a>
                {"\n  "}
              </Fragment>
            ))
          ) : (
            <>
              <div className={"empty"}>{"You're all caught up."}</div>
            </>
          )}
          {"\n"}
        </div>
      </div>
      {"\n"}
    </>
  );
}
